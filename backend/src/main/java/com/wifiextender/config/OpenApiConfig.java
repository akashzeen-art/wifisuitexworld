package com.wifiextender.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        final String schemeName = "bearerAuth";
        return new OpenAPI()
            .info(new Info()
                .title("WiFi Extender SaaS API")
                .description("REST API for the WiFi Extender SaaS Platform — Auth, Plans, Subscriptions, Licenses, Hotspots, Devices, Admin")
                .version("1.0.0")
                .contact(new Contact().name("WiFi Extender").email("admin@wifiextender.com")))
            .servers(List.of(
                new Server().url("http://localhost:8080").description("Local"),
                new Server().url("https://api.wifiextender.com").description("Production")))
            .addSecurityItem(new SecurityRequirement().addList(schemeName))
            .components(new Components()
                .addSecuritySchemes(schemeName, new SecurityScheme()
                    .name(schemeName)
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("Paste your JWT access token here")));
    }
}
