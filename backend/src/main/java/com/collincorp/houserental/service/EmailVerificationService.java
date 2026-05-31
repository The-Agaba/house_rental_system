package com.collincorp.houserental.service;

import com.collincorp.houserental.dto.RegisterRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class EmailVerificationService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    // Stores email -> verification code mapping
    private final Map<String, String> verificationCodes = new ConcurrentHashMap<>();

    // Stores email -> temporary registration details before DB insertion
    private final Map<String, RegisterRequest> pendingRegistrations = new ConcurrentHashMap<>();

    // Stores email -> verification code for existing landlords
    private final Map<String, String> landlordVerificationCodes = new ConcurrentHashMap<>();

    public EmailVerificationService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    private void sendEmail(String email, String subject, String text) {
        String cleanEmail = email.trim().toLowerCase();
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(senderEmail);
        message.setTo(cleanEmail);
        message.setSubject(subject);
        message.setText(text);
        mailSender.send(message);
    }

    public String generateLandlordVerificationCode(String email) {
        String cleanEmail = email.trim().toLowerCase();
        String code = String.format("%06d", new Random().nextInt(1000000));
        landlordVerificationCodes.put(cleanEmail, code);
        return code;
    }

    public void sendLandlordVerificationEmail(String email) {
        String cleanEmail = email.trim().toLowerCase();
        String code = generateLandlordVerificationCode(cleanEmail);

        sendEmail(cleanEmail,
                "Verify Your Landlord Account - RentHub",
                "Congratulations! Your landlord registration request on RentHub has been approved.\n\n" +
                        "To verify your email and activate your account, please use the following OTP code: " + code + "\n\n" +
                        "Once verified, you will be able to log in, complete your profile, and upload images for your registered properties.\n\n" +
                        "Welcome to RentHub!");
    }

    public void sendLandlordRequestMessage(String email, String locality) {
        sendEmail(email,
                "🏠 Landlord Registration Request Received - Action Required",
                "Dear Landlord,\n\n" +
                        "✅ Congratulations! Your landlord registration request for **" + locality + "** has been successfully received.\n\n" +
                        "📋 To complete your registration, please visit our **" + locality + " Central Office** with the following documents:\n\n" +
                        "📍 Required Documents:\n" +
                        "1️⃣ National ID (NIDA)\n" +
                        "2️⃣ Property Ownership Document\n" +
                        "3️⃣ Tax Identification Number (TIN)\n\n" +
                        "🕒 Our Office Hours:\n" +
                        "• Monday - Sunday: 08:00 AM - 06:00 PM\n" +
                        "• Including weekends (Saturday & Sunday)\n\n" +
                        "📍 Office Location:\n" +
                        locality + " Central Office\n\n" +
                        "⚠️ Important: Please bring ALL original documents for verification.\n\n" +
                        "We look forward to serving you!\n\n" +
                        "Best regards,\n" +
                        "House Rental Management Team 🏢"
        );
    }
    public boolean verifyLandlordCode(String email, String code) {
        String cleanEmail = email.trim().toLowerCase();
        if (landlordVerificationCodes.containsKey(cleanEmail) && landlordVerificationCodes.get(cleanEmail).equals(code)) {
            landlordVerificationCodes.remove(cleanEmail);
            return true;
        }
        return false;
    }

    public void queuePendingRegistration(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();

        // 1. Cache the registration details
        pendingRegistrations.put(email, request);

        // 2. Generate and cache a 6-digit random number
        String code = String.format("%06d", new Random().nextInt(1000000));
        verificationCodes.put(email, code);

        // 3. Send email asynchronously or synchronously
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(senderEmail);
        message.setTo(email);
        message.setSubject("Complete Your Registration - Verification Code");
        message.setText("Your 6-digit registration verification code is: " + code+"\n"+
         "Please Do not share with anyone , this is for security purpose "+"\n"+"\n"+" "+
                "!!! Warning Use it Before exipiration time and if it expired request new verification code."
        );

        mailSender.send(message);
    }

    public boolean verifyCode(String email, String code) {
        String cleanEmail = email.trim().toLowerCase();
        if (verificationCodes.containsKey(cleanEmail) && verificationCodes.get(cleanEmail).equals(code)) {
            verificationCodes.remove(cleanEmail); // Clear token instantly upon use
            return true;
        }
        return false;
    }

    public RegisterRequest getAndClearPendingRegistration(String email) {
        return pendingRegistrations.remove(email.trim().toLowerCase());
    }
}
