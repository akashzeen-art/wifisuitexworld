package com.wifiextender.utils

/**
 * Parses connected hotspot clients from Android/OEM dumpsys output.
 * Production parser — all major brands (MIUI, Samsung, Oppo, Vivo, etc.).
 */
object DumpsysClientParser {

    private val MAC = Regex("""([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}""")
    private val IPV4 = Regex(
        """\b(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b"""
    )

    fun parseAll(dump: String): List<ConnectedClient> {
        if (dump.isBlank()) return emptyList()
        val merged = LinkedHashMap<String, ConnectedClient>()
        fun add(client: ConnectedClient) {
            val key = client.macAddress?.uppercase()
                ?: client.ipAddress?.takeIf { it.isNotBlank() }
                ?: return
            if (client.macAddress == "00:00:00:00:00:00") return
            merged[key] = client
        }

        parseTetheringClientInformation(dump).forEach { add(it) }
        parseTetheringBpfHotspotIps(dump).forEach { add(it) }
        parseDumpsysWifiClients(dump).forEach { add(it) }
        parseStationBlocks(dump).forEach { add(it) }
        parseMacIpPairs(dump).forEach { add(it) }
        parseHostnameEntries(dump).forEach { add(it) }
        parseIpOnlyHotspotClients(dump).forEach { add(it) }

        return merged.values.toList()
    }

    /** IPs assigned to hotspot clients without MAC (common for iOS / Windows sleep). */
    private fun parseIpOnlyHotspotClients(dump: String): List<ConnectedClient> {
        val results = mutableListOf<ConnectedClient>()
        val seen = mutableSetOf<String>()
        val ipLine = Regex(
            """(?i)(?:client|station|lease|hotspot|tether)[^/\n]*/(\d{1,3}(?:\.\d{1,3}){3})"""
        )
        dump.lineSequence().forEach { line ->
            val ip = ipLine.find(line)?.groupValues?.get(1) ?: return@forEach
            if (ip.endsWith(".1") || ip in seen) return@forEach
            if (!DeviceNameResolver.isLikelyHotspotSubnetIp(ip)) return@forEach
            if (MAC.containsMatchIn(line)) return@forEach
            seen.add(ip)
            results.add(ConnectedClient(name = "", macAddress = null, ipAddress = ip, vendor = null))
        }
        return results
    }

    fun parseTetheringClientInformation(dump: String): List<ConnectedClient> =
        DeviceNameResolver.parseTetheringClientInformation(dump)

    fun parseTetheringBpfHotspotIps(dump: String): List<ConnectedClient> =
        DeviceNameResolver.parseTetheringBpfHotspotIps(dump)

    fun parseDumpsysWifiClients(dump: String): List<ConnectedClient> =
        DeviceNameResolver.parseDumpsysWifiClients(dump)

    /** Samsung SEM / generic Station blocks: Station: aa:bb:cc:dd:ee:ff */
    private fun parseStationBlocks(dump: String): List<ConnectedClient> {
        val results = mutableListOf<ConnectedClient>()
        val seen = mutableSetOf<String>()
        val stationRegex = Regex(
            """(?i)(?:Station|STA|client|sta)[:\s]+([0-9a-f]{2}(?::[0-9a-f]{2}){5})"""
        )
        dump.lineSequence().forEach { line ->
            val mac = stationRegex.find(line)?.groupValues?.get(1)?.uppercase() ?: return@forEach
            if (mac in seen || mac == "00:00:00:00:00:00") return@forEach
            val ip = IPV4.find(line)?.value
            seen.add(mac)
            results.add(
                ConnectedClient(
                    name = "",
                    macAddress = mac,
                    ipAddress = ip,
                    vendor = DeviceNameResolver.lookupVendor(mac)
                )
            )
        }
        return results
    }

    /** Any MAC + IP on same line or within 2 lines (Oppo/Vivo/Huawei dumps). */
    private fun parseMacIpPairs(dump: String): List<ConnectedClient> {
        val results = mutableListOf<ConnectedClient>()
        val seen = mutableSetOf<String>()
        val lines = dump.lines()
        for (i in lines.indices) {
            val window = lines.subList(i, minOf(i + 3, lines.size)).joinToString(" ")
            val mac = MAC.find(window)?.value?.uppercase()?.replace('-', ':') ?: continue
            if (mac in seen || mac == "00:00:00:00:00:00") continue
            val ip = IPV4.findAll(window).map { it.value }
                .firstOrNull { DeviceNameResolver.isLikelyHotspotSubnetIp(it) && !it.endsWith(".1") }
                ?: continue
            seen.add(mac)
            results.add(
                ConnectedClient(
                    name = "",
                    macAddress = mac,
                    ipAddress = ip,
                    vendor = DeviceNameResolver.lookupVendor(mac)
                )
            )
        }
        return results
    }

    /** hostname= / hostName= / name= entries with MAC nearby */
    private fun parseHostnameEntries(dump: String): List<ConnectedClient> {
        val results = mutableListOf<ConnectedClient>()
        val seen = mutableSetOf<String>()
        val hostRegex = Regex(
            """(?i)(?:hostname|hostName|deviceName|name)[=:\s]+"?([A-Za-z0-9][A-Za-z0-9._-]{1,48})"?"""
        )
        dump.lineSequence().forEach { line ->
            val hostname = hostRegex.find(line)?.groupValues?.get(1)
                ?.takeIf { DeviceNameResolver.isRealHostname(it) } ?: return@forEach
            val mac = MAC.find(line)?.value?.uppercase()?.replace('-', ':') ?: return@forEach
            if (mac in seen) return@forEach
            val ip = IPV4.find(line)?.value
            seen.add(mac)
            results.add(
                ConnectedClient(
                    name = hostname,
                    macAddress = mac,
                    ipAddress = ip,
                    vendor = DeviceNameResolver.lookupVendor(mac)
                )
            )
        }
        return results
    }

    fun runDumpsys(command: Array<String>): String {
        return try {
            val proc = Runtime.getRuntime().exec(command)
            val output = buildString {
                append(proc.inputStream.bufferedReader().readText())
                append(proc.errorStream.bufferedReader().readText())
            }
            proc.waitFor()
            output
        } catch (_: Exception) {
            ""
        }
    }

    fun collectFromAllSources(): List<ConnectedClient> {
        val merged = LinkedHashMap<String, ConnectedClient>()
        fun absorb(clients: List<ConnectedClient>) {
            clients.forEach { c ->
                val key = c.macAddress?.uppercase() ?: c.ipAddress ?: return@forEach
                merged[key] = c
            }
        }

        val baseCommands = listOf(
            arrayOf("dumpsys", "tethering"),
            arrayOf("dumpsys", "wifi"),
            arrayOf("dumpsys", "connectivity")
        )
        (baseCommands + OemBrandDetector.extraDumpsysCommands()).forEach { cmd ->
            val dump = runDumpsys(cmd)
            if (dump.isNotBlank() && !dump.contains("Permission Denial", ignoreCase = true)) {
                absorb(parseAll(dump))
            }
        }
        return merged.values.toList()
    }
}
