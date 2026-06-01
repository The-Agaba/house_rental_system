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

    public String generateLandlordVerificationCode(String email) {
        String cleanEmail = email.trim().toLowerCase();
        String code = String.format("%06d", new Random().nextInt(1000000));
        landlordVerificationCodes.put(cleanEmail, code);
        return code;
    }

    public void sendLandlordVerificationEmail(String email) {
        String cleanEmail = email.trim().toLowerCase();
        String code = generateLandlordVerificationCode(cleanEmail);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(senderEmail);
        message.setTo(cleanEmail);
        message.setSubject("Landlord Account Verification - RentHub");
        message.setText("Welcome to RentHub!\n\n" +
                "Your landlord account has been approved. To complete the verification process:\n\n" +
                "1. Visit the RentHub homepage (https://rentalhub.com)\n" +
                "2. Open the 'Verify Code' menu option from the navigation\n" +
                "3. Enter your email and the verification code below\n\n" +
                "Your verification code is: " + code + "\n\n" +
                "This code will expire after use or after a set time period. " +
                "Do not share this code with anyone.\n\n" +
                "Once verified, you can log in with your credentials and manage your properties.\n\n" +
                "Need help? Contact our support team at support@rentalhub.com");
        mailSender.send(message);
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

    /**
     * Resend verification code for tenant registration.
     * Invalidates old code and generates a new one.
     */
    public String resendVerificationCode(String email) {
        String cleanEmail = email.trim().toLowerCase();
        
        // Invalidate old code if exists
        verificationCodes.remove(cleanEmail);
        
        // Generate new code
        String newCode = String.format("%06d", new Random().nextInt(1000000));
        verificationCodes.put(cleanEmail, newCode);
        
        // Send email
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(senderEmail);
        message.setTo(cleanEmail);
        message.setSubject("Verification Code - RentHub Registration");
        message.setText("Your new 6-digit verification code is: " + newCode + "\n\n" +
                "This code will expire after one attempt or after a certain time period. " +
                "Do not share this code with anyone.\n\n" +
                "If you did not request this code, please ignore this email.");
        mailSender.send(message);
        
        return newCode;
    }

    /**
     * Resend verification code for landlord account verification.
     * Invalidates old code and generates a new one.
     */
    public String resendLandlordVerificationCode(String email) {
        String cleanEmail = email.trim().toLowerCase();
        
        // Invalidate old code if exists
        landlordVerificationCodes.remove(cleanEmail);
        
        // Generate new code
        String newCode = String.format("%06d", new Random().nextInt(1000000));
        landlordVerificationCodes.put(cleanEmail, newCode);
        
        // Send email with improved instructions
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(senderEmail);
        message.setTo(cleanEmail);
        message.setSubject("Landlord Account Verification - RentHub");
        message.setText("Welcome to RentHub!\n\n" +
                "Your landlord account has been approved. To complete the verification process:\n\n" +
                "1. Visit the RentHub homepage (https://rentalhub.com)\n" +
                "2. Open the 'Verify Code' menu option from the navigation\n" +
                "3. Enter your email and the verification code below\n\n" +
                "Your verification code is: " + newCode + "\n\n" +
                "This code will expire after use or after a set time period. " +
                "Do not share this code with anyone.\n\n" +
                "Once verified, you can log in with your credentials and manage your properties.\n\n" +
                "Need help? Contact our support team at support@rentalhub.com");
        mailSender.send(message);
        
        return newCode;
    }

    /**
     * Send landlord approval email with verification code and temporary password.
     * This email is sent when an agent approves a new landlord registration.
     */
    public void sendLandlordApprovalEmail(String email, String verificationCode, String temporaryPassword) {
        String cleanEmail = email.trim().toLowerCase();
        
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(senderEmail);
        message.setTo(cleanEmail);
        message.setSubject("Your RentHub Landlord Account has been Approved!");
        message.setText("Congratulations!\n\n" +
                "Your landlord registration request has been approved. Your account is now ready to use.\n\n" +
                "ACCOUNT ACTIVATION DETAILS:\n" +
                "================================\n" +
                "Your verification code: " + verificationCode + "\n" +
                "Your temporary password: " + temporaryPassword + "\n" +
                "================================\n\n" +
                "TO COMPLETE YOUR SETUP:\n" +
                "1. Visit the RentHub homepage (https://rentalhub.com)\n" +
                "2. Click 'Verify Code' in the navigation menu\n" +
                "3. Enter your email and the verification code above\n" +
                "4. Create a permanent password when prompted\n" +
                "5. Log in to your landlord dashboard\n\n" +
                "SECURITY REMINDER:\n" +
                "- Do not share your password with anyone\n" +
                "- Do not share your verification code with anyone\n" +
                "- Destroy this email after saving your credentials securely\n\n" +
                "NEED HELP?\n" +
                "Contact our support team at support@rentalhub.com or visit https://rentalhub.com/manual\n\n" +
                "Welcome to the RentHub community!");
        mailSender.send(message);
    }
}
