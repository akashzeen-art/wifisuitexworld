package com.wifiextender.utils

import android.os.Build

/** Detects phone OEM and supplies brand-specific hotspot discovery hints. */
enum class PhoneBrand {
    XIAOMI, REDMI, POCO,
    SAMSUNG,
    OPPO, REALME, ONEPLUS,
    VIVO, IQOO,
    HUAWEI, HONOR,
    MOTOROLA, NOKIA,
    GOOGLE,
    TECNO, INFINIX,
    LENOVO,
    GENERIC
}

object OemBrandDetector {

    private val brand: PhoneBrand by lazy { detectBrand() }

    fun current(): PhoneBrand = brand

    fun displayName(): String = when (brand) {
        PhoneBrand.XIAOMI, PhoneBrand.REDMI, PhoneBrand.POCO -> "Xiaomi"
        PhoneBrand.SAMSUNG -> "Samsung"
        PhoneBrand.OPPO -> "Oppo"
        PhoneBrand.REALME -> "Realme"
        PhoneBrand.ONEPLUS -> "OnePlus"
        PhoneBrand.VIVO -> "Vivo"
        PhoneBrand.IQOO -> "iQOO"
        PhoneBrand.HUAWEI -> "Huawei"
        PhoneBrand.HONOR -> "Honor"
        PhoneBrand.MOTOROLA -> "Motorola"
        PhoneBrand.NOKIA -> "Nokia"
        PhoneBrand.GOOGLE -> "Google"
        PhoneBrand.TECNO -> "Tecno"
        PhoneBrand.INFINIX -> "Infinix"
        PhoneBrand.LENOVO -> "Lenovo"
        PhoneBrand.GENERIC -> "Android"
    }

    fun detectBrand(): PhoneBrand {
        val man = Build.MANUFACTURER.lowercase()
        val brandStr = Build.BRAND.lowercase()
        return when {
            man.contains("xiaomi") || brandStr.contains("xiaomi") -> PhoneBrand.XIAOMI
            man.contains("redmi") || brandStr.contains("redmi") -> PhoneBrand.REDMI
            man.contains("poco") || brandStr.contains("poco") -> PhoneBrand.POCO
            man.contains("samsung") -> PhoneBrand.SAMSUNG
            man.contains("oppo") -> PhoneBrand.OPPO
            man.contains("realme") -> PhoneBrand.REALME
            man.contains("oneplus") -> PhoneBrand.ONEPLUS
            man.contains("vivo") -> PhoneBrand.VIVO
            man.contains("iqoo") -> PhoneBrand.IQOO
            man.contains("huawei") -> PhoneBrand.HUAWEI
            man.contains("honor") -> PhoneBrand.HONOR
            man.contains("motorola") || man.contains("lenovo") && brandStr.contains("moto") -> PhoneBrand.MOTOROLA
            man.contains("nokia") || man.contains("hmd") -> PhoneBrand.NOKIA
            man.contains("google") -> PhoneBrand.GOOGLE
            man.contains("tecno") -> PhoneBrand.TECNO
            man.contains("infinix") -> PhoneBrand.INFINIX
            man.contains("lenovo") -> PhoneBrand.LENOVO
            else -> PhoneBrand.GENERIC
        }
    }

    /** Common hotspot /24 prefixes per OEM (first three octets). */
    fun preferredSubnetPrefixes(): List<String> = when (brand) {
        PhoneBrand.XIAOMI, PhoneBrand.REDMI, PhoneBrand.POCO -> listOf(
            "10.142.108", "10.142.109", "10.142.110", "10.50.50", "10.42.0", "192.168.43"
        )
        PhoneBrand.SAMSUNG -> listOf(
            "10.0.0", "10.59.120", "192.168.43", "192.168.49", "192.168.137"
        )
        PhoneBrand.OPPO, PhoneBrand.REALME, PhoneBrand.ONEPLUS -> listOf(
            "192.168.43", "192.168.4", "192.168.137", "10.142.108", "10.0.0"
        )
        PhoneBrand.VIVO, PhoneBrand.IQOO -> listOf(
            "192.168.43", "192.168.4", "192.168.173", "10.142.108"
        )
        PhoneBrand.HUAWEI, PhoneBrand.HONOR -> listOf(
            "192.168.43", "192.168.4", "192.168.1", "192.168.137"
        )
        PhoneBrand.MOTOROLA, PhoneBrand.LENOVO -> listOf(
            "192.168.43", "192.168.4", "192.168.137", "10.0.0"
        )
        PhoneBrand.GOOGLE -> listOf(
            "192.168.49", "192.168.43", "10.0.0", "10.0.1"
        )
        PhoneBrand.TECNO, PhoneBrand.INFINIX -> listOf(
            "192.168.43", "192.168.4", "10.142.108"
        )
        PhoneBrand.NOKIA -> listOf(
            "192.168.43", "192.168.4", "192.168.137"
        )
        PhoneBrand.GENERIC -> listOf(
            "192.168.43", "192.168.4", "192.168.49", "192.168.137", "192.168.176",
            "10.142.108", "10.142.109", "10.50.50", "10.42.0", "10.0.0", "172.20.10"
        )
    }

    /** Network interfaces that carry the soft-AP on each OEM. */
    fun preferredApInterfaces(): List<String> = when (brand) {
        PhoneBrand.XIAOMI, PhoneBrand.REDMI, PhoneBrand.POCO -> listOf(
            "wlan0", "ap_br_wlan2", "wlan1", "wlan2", "ap0", "softap0"
        )
        PhoneBrand.SAMSUNG -> listOf(
            "swlan0", "wlan1", "wlan2", "ap0", "softap0", "wlan0"
        )
        PhoneBrand.OPPO, PhoneBrand.REALME, PhoneBrand.ONEPLUS -> listOf(
            "wlan1", "wlan2", "ap0", "ap_br_wlan2", "wlan0", "softap0"
        )
        PhoneBrand.VIVO, PhoneBrand.IQOO -> listOf(
            "wlan1", "wlan2", "ap0", "wlan0", "softap0"
        )
        PhoneBrand.HUAWEI, PhoneBrand.HONOR -> listOf(
            "wlan1", "wlan2", "ap0", "softap0", "wlan0"
        )
        else -> listOf(
            "wlan1", "wlan2", "ap0", "softap0", "swlan0", "rndis0", "p2p0", "wlan0"
        )
    }

    /** DHCP lease file paths tried per OEM. */
    fun dhcpLeasePaths(): List<String> = when (brand) {
        PhoneBrand.XIAOMI, PhoneBrand.REDMI, PhoneBrand.POCO -> listOf(
            "/data/misc/dhcp/dnsmasq.leases",
            "/data/misc/wifi/hostapd/dhcp.leases",
            "/data/vendor/wifi/hostapd/dhcp.leases",
            "/data/misc/wifi/dhcp.leases"
        )
        PhoneBrand.SAMSUNG -> listOf(
            "/data/misc/dhcp/dnsmasq.leases",
            "/data/misc/wifi/hostapd/dhcp.leases",
            "/data/misc/wifi/dhcp.leases"
        )
        PhoneBrand.OPPO, PhoneBrand.REALME, PhoneBrand.ONEPLUS, PhoneBrand.VIVO, PhoneBrand.IQOO -> listOf(
            "/data/misc/dhcp/dnsmasq.leases",
            "/data/misc/wifi/hostapd/dhcp.leases",
            "/data/oplus/wifi/hostapd/dhcp.leases",
            "/data/misc/wifi/dhcp.leases"
        )
        else -> listOf(
            "/data/misc/dhcp/dnsmasq.leases",
            "/data/misc/wifi/hostapd/dhcp.leases",
            "/data/misc/wifi/dhcp.leases"
        )
    }

    /** Extra dumpsys commands useful on specific OEMs. */
    fun extraDumpsysCommands(): List<Array<String>> {
        val cmds = mutableListOf<Array<String>>()
        when (brand) {
            PhoneBrand.SAMSUNG -> {
                cmds.add(arrayOf("dumpsys", "semwifi"))
                cmds.add(arrayOf("dumpsys", "wifi", "softap"))
            }
            PhoneBrand.XIAOMI, PhoneBrand.REDMI, PhoneBrand.POCO -> {
                cmds.add(arrayOf("dumpsys", "netd"))
                cmds.add(arrayOf("dumpsys", "wifi", "softap"))
            }
            PhoneBrand.OPPO, PhoneBrand.REALME, PhoneBrand.ONEPLUS -> {
                cmds.add(arrayOf("dumpsys", "OplusWifiService"))
                cmds.add(arrayOf("dumpsys", "wifi", "softap"))
            }
            PhoneBrand.VIVO, PhoneBrand.IQOO -> {
                cmds.add(arrayOf("dumpsys", "vivo_wifi"))
                cmds.add(arrayOf("dumpsys", "wifi", "softap"))
            }
            PhoneBrand.HUAWEI, PhoneBrand.HONOR -> {
                cmds.add(arrayOf("dumpsys", "HwWifiService"))
            }
            else -> {}
        }
        cmds.add(arrayOf("dumpsys", "netstats"))
        return cmds
    }
}
