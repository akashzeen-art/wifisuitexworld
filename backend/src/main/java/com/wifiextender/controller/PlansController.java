package com.wifiextender.controller;

import com.wifiextender.dto.PlanDto;
import com.wifiextender.repository.PlanRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@Tag(name = "Plans", description = "Public plan listing")
@RestController
@RequestMapping("/api/plans")
@RequiredArgsConstructor
public class PlansController {

    private final PlanRepository planRepository;

    @Operation(summary = "List all active plans")
    @GetMapping
    public ResponseEntity<List<PlanDto.Response>> list() {
        return ResponseEntity.ok(
            planRepository.findByActiveTrueOrderBySortOrderAscPriceAsc()
                .stream().map(PlanDto.Response::from).collect(Collectors.toList())
        );
    }

    @Operation(summary = "Get plan by ID")
    @GetMapping("/{id}")
    public ResponseEntity<PlanDto.Response> get(@PathVariable Long id) {
        return planRepository.findById(id)
                .map(p -> ResponseEntity.ok(PlanDto.Response.from(p)))
                .orElse(ResponseEntity.notFound().build());
    }
}
