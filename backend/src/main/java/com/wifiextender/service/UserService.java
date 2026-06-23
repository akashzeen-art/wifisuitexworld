package com.wifiextender.service;

import com.wifiextender.dto.AuthDto;
import com.wifiextender.dto.UserSettingsDto;
import com.wifiextender.entity.User;
import com.wifiextender.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final ConnectedDeviceRepository deviceRepository;
    private final HotspotRepository hotspotRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final LicenseRepository licenseRepository;
    private final PaymentRepository paymentRepository;
    private final BandwidthUsageRepository bandwidthRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthDto.UserInfo toUserInfo(User user) {
        AuthDto.UserInfo info = new AuthDto.UserInfo(
                user.getId(), user.getName(), user.getEmail(),
                user.getRole().name(), user.isActive(),
                user.getCreatedAt(), user.getLastLogin()
        );
        info.setNotifyDeviceConnect(user.isNotifyDeviceConnect());
        info.setNotifyDeviceBlock(user.isNotifyDeviceBlock());
        info.setNotifyLicenseExpiry(user.isNotifyLicenseExpiry());
        info.setNotifyNewsletter(user.isNotifyNewsletter());
        return info;
    }

    @Transactional
    public AuthDto.UserInfo updateProfile(User user, UserSettingsDto.UpdateProfileRequest req) {
        String email = req.getEmail().toLowerCase().trim();
        String name = req.getName().trim();

        if (name.length() < 2) {
            throw new IllegalArgumentException("Name must be at least 2 characters");
        }
        if (userRepository.existsByEmailAndIdNot(email, user.getId())) {
            throw new IllegalArgumentException("Email is already in use");
        }

        user.setName(name);
        user.setEmail(email);
        return toUserInfo(userRepository.save(user));
    }

    @Transactional
    public void changePassword(User user, UserSettingsDto.ChangePasswordRequest req) {
        if (!req.getNewPassword().equals(req.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }
        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
        refreshTokenRepository.revokeAllByUserId(user.getId());
    }

    @Transactional
    public AuthDto.UserInfo updateNotifications(User user, UserSettingsDto.NotificationSettings req) {
        user.setNotifyDeviceConnect(req.isDeviceConnect());
        user.setNotifyDeviceBlock(req.isDeviceBlock());
        user.setNotifyLicenseExpiry(req.isLicenseExpiry());
        user.setNotifyNewsletter(req.isNewsletter());
        return toUserInfo(userRepository.save(user));
    }

    @Transactional
    public void deleteAccount(User user, String password) {
        if (user.getRole() == User.Role.ADMIN) {
            throw new IllegalStateException("Admin accounts cannot be deleted from the dashboard");
        }
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Incorrect password");
        }

        Long userId = user.getId();
        bandwidthRepository.deleteByUserId(userId);
        deviceRepository.deleteByUserId(userId);
        licenseRepository.deleteByUserId(userId);
        paymentRepository.deleteByUserId(userId);
        subscriptionRepository.deleteByUserId(userId);
        hotspotRepository.deleteByUserId(userId);
        refreshTokenRepository.deleteByUserId(userId);
        userRepository.delete(user);
    }
}
