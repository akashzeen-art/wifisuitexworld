package com.wifiextender.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.stream.Stream;

@Tag(name = "Downloads", description = "Desktop and mobile app downloads")
@RestController
@RequestMapping("/api/download")
public class DownloadController {

    private static final String WINDOWS_FILENAME = "WiFiExtender-Setup.exe";
    private static final String ANDROID_FILENAME = "WiFiExtender-Android.apk";

    @Value("${app.download.windows-installer:}")
    private String configuredWindowsInstaller;

    @Value("${app.download.android-apk:}")
    private String configuredAndroidApk;

    @Operation(summary = "Download Windows desktop installer")
    @SecurityRequirements
    @GetMapping("/windows")
    public ResponseEntity<Resource> downloadWindows() throws IOException {
        Path installer = resolveWindowsInstaller();
        if (installer == null) {
            return ResponseEntity.notFound().build();
        }
        return fileResponse(installer, WINDOWS_FILENAME, MediaType.APPLICATION_OCTET_STREAM);
    }

    @Operation(summary = "Download Android APK")
    @SecurityRequirements
    @GetMapping("/android")
    public ResponseEntity<Resource> downloadAndroid() throws IOException {
        Path apk = resolveAndroidApk();
        if (apk == null) {
            return ResponseEntity.notFound().build();
        }
        return fileResponse(apk, ANDROID_FILENAME, MediaType.parseMediaType("application/vnd.android.package-archive"));
    }

    private ResponseEntity<Resource> fileResponse(Path file, String filename, MediaType contentType) throws IOException {
        Resource resource = new FileSystemResource(file);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename + "\"; filename*=UTF-8''" + filename)
                .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                .header("X-Content-Type-Options", "nosniff")
                .contentType(contentType)
                .contentLength(Files.size(file))
                .body(resource);
    }

    private Path resolveWindowsInstaller() {
        if (configuredWindowsInstaller != null && !configuredWindowsInstaller.isBlank()) {
            Path p = Paths.get(configuredWindowsInstaller.trim());
            if (Files.isRegularFile(p)) return p.toAbsolutePath();
        }

        Path[] candidates = {
            Paths.get("downloads", "wifi-extender-setup.exe"),
            Paths.get("..", "frontend", "public", "downloads", "wifi-extender-setup.exe"),
            Paths.get("..", "desktop-app", "dist", "WiFiExtender Setup 1.0.0.exe"),
            Paths.get("..", "desktop-app", "dist", "wifi-extender-setup.exe"),
        };

        for (Path candidate : candidates) {
            Path abs = candidate.toAbsolutePath().normalize();
            if (Files.isRegularFile(abs)) return abs;
        }

        Path distDir = Paths.get("..", "desktop-app", "dist").toAbsolutePath().normalize();
        return firstFileWithExtension(distDir, ".exe", "uninstall");
    }

    private Path resolveAndroidApk() {
        if (configuredAndroidApk != null && !configuredAndroidApk.isBlank()) {
            Path p = Paths.get(configuredAndroidApk.trim());
            if (Files.isRegularFile(p)) return p.toAbsolutePath();
        }

        Path[] candidates = {
            Paths.get("downloads", "wifi-extender-android.apk"),
            Paths.get("..", "frontend", "public", "downloads", "wifi-extender-android.apk"),
            Paths.get("..", "android", "app", "build", "outputs", "apk", "debug", "app-debug.apk"),
            Paths.get("..", "android", "app", "build", "outputs", "apk", "release", "app-release.apk"),
        };

        for (Path candidate : candidates) {
            Path abs = candidate.toAbsolutePath().normalize();
            if (Files.isRegularFile(abs)) return abs;
        }

        Path apkRoot = Paths.get("..", "android", "app", "build", "outputs", "apk").toAbsolutePath().normalize();
        return findApkRecursively(apkRoot);
    }

    private Path firstFileWithExtension(Path dir, String ext, String excludeContains) {
        if (!Files.isDirectory(dir)) return null;
        try (Stream<Path> files = Files.list(dir)) {
            return files
                    .filter(p -> p.toString().toLowerCase().endsWith(ext))
                    .filter(p -> excludeContains == null || !p.getFileName().toString().toLowerCase().contains(excludeContains))
                    .findFirst()
                    .orElse(null);
        } catch (Exception ignored) {
            return null;
        }
    }

    private Path findApkRecursively(Path root) {
        if (!Files.isDirectory(root)) return null;
        try (Stream<Path> walk = Files.walk(root, 4)) {
            return walk
                    .filter(Files::isRegularFile)
                    .filter(p -> p.toString().toLowerCase().endsWith(".apk"))
                    .findFirst()
                    .orElse(null);
        } catch (Exception ignored) {
            return null;
        }
    }
}
