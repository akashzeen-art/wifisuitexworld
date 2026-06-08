package com.wifiextender.repository;

import com.wifiextender.entity.LicenseActivation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LicenseActivationRepository extends JpaRepository<LicenseActivation, Long> {

    @Query("SELECT a FROM LicenseActivation a WHERE a.license.id = :licenseId ORDER BY a.createdAt DESC")
    List<LicenseActivation> findByLicenseId(@Param("licenseId") Long licenseId);

    @Query("SELECT COUNT(a) FROM LicenseActivation a WHERE a.license.id = :licenseId AND a.result = 'SUCCESS'")
    long countSuccessfulByLicenseId(@Param("licenseId") Long licenseId);
}
