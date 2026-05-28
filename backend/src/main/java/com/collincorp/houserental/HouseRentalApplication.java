package com.collincorp.houserental;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;

import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HouseRentalApplication {

    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(HouseRentalApplication.class, args);
        System.out.println("");
    }

    private static void loadDotEnv() {
        File dir = new File(".").getAbsoluteFile();
        File envFile = null;
        while (dir != null) {
            File testFile = new File(dir, ".env");
            if (testFile.exists()) {
                envFile = testFile;
                break;
            }
            dir = dir.getParentFile();
        }
        if (envFile != null) {
            System.out.println("Loading environment variables from: " + envFile.getAbsolutePath());
            try (BufferedReader reader = new BufferedReader(new FileReader(envFile))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    line = line.trim();
                    if (line.isEmpty() || line.startsWith("#")) {
                        continue;
                    }
                    int eqIdx = line.indexOf('=');
                    if (eqIdx > 0) {
                        String key = line.substring(0, eqIdx).trim();
                        String value = line.substring(eqIdx + 1).trim();
                        if ((value.startsWith("\"") && value.endsWith("\"")) || 
                            (value.startsWith("'") && value.endsWith("'"))) {
                            value = value.substring(1, value.length() - 1);
                        }
                        System.setProperty(key, value);
                    }
                }
            } catch (IOException e) {
                System.err.println("Could not load .env file: " + e.getMessage());
            }
        } else {
            System.out.println(".env file not found. Falling back to default/environment variables.");
        }
    }

}

