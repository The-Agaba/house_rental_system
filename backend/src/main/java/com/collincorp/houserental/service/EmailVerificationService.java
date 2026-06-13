package com.collincorp.houserental.service;

import com.collincorp.houserental.dto.RegisterRequest;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
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

    private void sendHtmlEmail(String to, String subject, String textBody, String htmlBody) {
        String cleanEmail = to.trim().toLowerCase();
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(senderEmail);
            helper.setTo(cleanEmail);
            helper.setSubject(subject);
            helper.setText(textBody, htmlBody);
            mailSender.send(mimeMessage);
        } catch (Exception e) {
            System.err.println("Failed to send HTML email to " + cleanEmail + ": " + e.getMessage());
            throw new RuntimeException("Email send failed", e);
        }
    }

    private String buildEmailHtml(String heading, String intro, String contentHtml) {
        return """
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                  <div style="background-color: #2563eb; padding: 24px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 1px;">RentHub</h1>
                  </div>
                  <div style="padding: 32px 24px;">
                    <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 20px; font-weight: 700;">%s</h2>
                    <p style="margin: 0 0 24px; font-size: 15px; color: #334155;">%s</p>
                    %s
                  </div>
                  <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0; font-size: 12px; color: #64748b;">This is an automated message from RentHub. Please do not reply directly to this email.</p>
                  </div>
                </div>
                """.formatted(heading, intro, contentHtml);
    }

    public String generateLandlordVerificationCode(String email) {
        String cleanEmail = email.trim().toLowerCase();
        String code = String.format("%06d", new Random().nextInt(1000000));
        landlordVerificationCodes.put(cleanEmail, code);
        return code;
    }

    public void sendEmailNotification(String email, String subject, String body) {
        String cleanEmail = email.trim().toLowerCase();
        String htmlContent = """
                <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                  <p style="margin: 0; font-size: 14px; color: #334155; white-space: pre-line;">%s</p>
                </div>
                """.formatted(body);
        String htmlBody = buildEmailHtml(subject, "Here is an important update regarding your request on RentHub.", htmlContent);
        sendHtmlEmail(cleanEmail, "RentHub: " + subject, body, htmlBody);
    }

    public void sendLandlordVerificationEmail(String email) {
        String cleanEmail = email.trim().toLowerCase();
        String code = generateLandlordVerificationCode(cleanEmail);

        String subject = "Landlord Account Verification - RentHub";
        String textBody = "Welcome to RentHub!\n\n" +
                "Your landlord account has been approved. To complete the verification process:\n\n" +
                "1. Visit the RentHub homepage (https://rentalhub.com)\n" +
                "2. Open the 'Verify Code' menu option from the navigation\n" +
                "3. Enter your email and the verification code below\n\n" +
                "Your verification code is: " + code + "\n\n" +
                "This code will expire after use or after a set time period. " +
                "Do not share this code with anyone.\n\n" +
                "Once verified, you can log in with your credentials and manage your properties.\n\n" +
                "Need help? Contact our support team at support@rentalhub.com";

        String htmlContent = """
                <div style="background-color: #f1f5f9; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                  <span style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Your Verification Code</span>
                  <span style="font-size: 32px; font-weight: 900; color: #2563eb; letter-spacing: 4px; display: block;">%s</span>
                </div>
                <h3 style="margin: 0 0 12px; color: #0f172a; font-size: 14px; font-weight: 700;">Steps to complete setup:</h3>
                <ol style="margin: 0 0 24px; padding-left: 20px; font-size: 14px; color: #334155; line-height: 1.8;">
                  <li>Visit the <a href="https://rentalhub.com" style="color: #2563eb; text-decoration: none; font-weight: 600;">RentHub homepage</a></li>
                  <li>Click on <strong>Verify Code</strong> in the navigation bar</li>
                  <li>Enter your email and the code shown above</li>
                  <li>Set your permanent password and log in</li>
                </ol>
                <div style="border-left: 4px solid #f59e0b; padding-left: 16px; margin-bottom: 24px;">
                  <p style="margin: 0; font-size: 13px; color: #b45309; font-weight: 600;">Security Warning:</p>
                  <p style="margin: 4px 0 0; font-size: 13px; color: #d97706;">Do not share this verification code or temporary password with anyone. Use it before it expires.</p>
                </div>
                """.formatted(code);

        String htmlBody = buildEmailHtml("Landlord Account Verification", "Welcome to RentHub! Your landlord account registration is ready. Complete the verification steps below to activate your listing tools.", htmlContent);
        sendHtmlEmail(cleanEmail, subject, textBody, htmlBody);
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

        String subject = "Complete Your Registration - Verification Code";
        String textBody = "Your 6-digit registration verification code is: " + code + "\n" +
                "Please Do not share with anyone , this is for security purpose \n\n" +
                "!!! Warning Use it Before expiration time and if it expired request new verification code.";

        String htmlContent = """
                <div style="background-color: #f1f5f9; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                  <span style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Registration Code</span>
                  <span style="font-size: 32px; font-weight: 900; color: #2563eb; letter-spacing: 4px; display: block;">%s</span>
                </div>
                <div style="border-left: 4px solid #ef4444; padding-left: 16px; margin-bottom: 24px;">
                  <p style="margin: 0; font-size: 13px; color: #b91c1c; font-weight: 600;">Important Security Note:</p>
                  <p style="margin: 4px 0 0; font-size: 13px; color: #dc2626;">Do not share this registration verification code with anyone. Make sure to use it before it expires.</p>
                </div>
                """.formatted(code);

        String htmlBody = buildEmailHtml("Complete Your Registration", "Thank you for joining RentHub! Enter the 6-digit verification code below to verify your email address and activate your account.", htmlContent);
        sendHtmlEmail(email, "RentHub: " + subject, textBody, htmlBody);
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
        String subject = "Verification Code - RentHub Registration";
        String textBody = "Your new 6-digit verification code is: " + newCode + "\n\n" +
                "This code will expire after one attempt or after a certain time period. " +
                "Do not share this code with anyone.\n\n" +
                "If you did not request this code, please ignore this email.";

        String htmlContent = """
                <div style="background-color: #f1f5f9; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                  <span style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">New Registration Code</span>
                  <span style="font-size: 32px; font-weight: 900; color: #2563eb; letter-spacing: 4px; display: block;">%s</span>
                </div>
                <p style="font-size: 13px; color: #64748b; margin-bottom: 24px;">If you did not initiate this request, you can safely ignore this email.</p>
                """.formatted(newCode);

        String htmlBody = buildEmailHtml("New Verification Code Requested", "We received a request for a new verification code for your RentHub registration. Please use the code below.", htmlContent);
        sendHtmlEmail(cleanEmail, "RentHub: " + subject, textBody, htmlBody);
        
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
        
        // Send email
        String subject = "Landlord Account Verification - RentHub";
        String textBody = "Welcome to RentHub!\n\n" +
                "Your landlord account has been approved. To complete the verification process:\n\n" +
                "1. Visit the RentHub homepage (https://rentalhub.com)\n" +
                "2. Open the 'Verify Code' menu option from the navigation\n" +
                "3. Enter your email and the verification code below\n\n" +
                "Your verification code is: " + newCode + "\n\n" +
                "This code will expire after use or after a set time period. " +
                "Do not share this code with anyone.\n\n" +
                "Once verified, you can log in with your credentials and manage your properties.\n\n" +
                "Need help? Contact our support team at support@rentalhub.com";

        String htmlContent = """
                <div style="background-color: #f1f5f9; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                  <span style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Your Verification Code</span>
                  <span style="font-size: 32px; font-weight: 900; color: #2563eb; letter-spacing: 4px; display: block;">%s</span>
                </div>
                <h3 style="margin: 0 0 12px; color: #0f172a; font-size: 14px; font-weight: 700;">Steps to complete setup:</h3>
                <ol style="margin: 0 0 24px; padding-left: 20px; font-size: 14px; color: #334155; line-height: 1.8;">
                  <li>Visit the <a href="https://rentalhub.com" style="color: #2563eb; text-decoration: none; font-weight: 600;">RentHub homepage</a></li>
                  <li>Click on <strong>Verify Code</strong> in the navigation bar</li>
                  <li>Enter your email and the code shown above</li>
                  <li>Set your permanent password and log in</li>
                </ol>
                """.formatted(newCode);

        String htmlBody = buildEmailHtml("Landlord Account Verification", "Welcome to RentHub! Your landlord account registration is ready. Use the verification code below to complete registration.", htmlContent);
        sendHtmlEmail(cleanEmail, subject, textBody, htmlBody);
        
        return newCode;
    }

    /**
     * Send landlord approval email with verification code and temporary password.
     * This email is sent when an agent approves a new landlord registration.
     */
    public void sendLandlordApprovalEmail(String email, String verificationCode, String temporaryPassword) {
        String cleanEmail = email.trim().toLowerCase();
        String subject = "Your RentHub Landlord Account has been Approved!";
        
        StringBuilder textBody = new StringBuilder();
        textBody.append("Congratulations!\n\n")
                .append("Your landlord registration request has been approved. Your account is now ready to use.\n\n")
                .append("ACCOUNT ACTIVATION DETAILS:\n")
                .append("================================\n")
                .append("Your verification code: ").append(verificationCode).append("\n");
        if (temporaryPassword != null) {
            textBody.append("Your temporary password: ").append(temporaryPassword).append("\n");
        }
        textBody.append("================================\n\n")
                .append("TO COMPLETE YOUR SETUP:\n")
                .append("1. Visit the RentHub homepage (https://rentalhub.com)\n")
                .append("2. Click 'Verify Code' in the navigation menu\n")
                .append("3. Enter your email and the verification code above\n")
                .append("4. Create a permanent password when prompted\n")
                .append("5. Log in to your landlord dashboard\n\n")
                .append("SECURITY REMINDER:\n")
                .append("- Do not share your password with anyone\n")
                .append("- Do not share your verification code with anyone\n")
                .append("- Destroy this email after saving your credentials securely\n\n")
                .append("NEED HELP?\n")
                .append("Contact our support team at support@rentalhub.com or visit https://rentalhub.com/manual\n\n")
                .append("Welcome to the RentHub community!");

        String credentialSectionHtml = temporaryPassword != null ? """
                <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                  <table style="width: 100%%; border-collapse: collapse;">
                    <tr><td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: bold;">VERIFICATION CODE</td><td style="padding: 8px 0; font-size: 16px; color: #2563eb; font-weight: 850; letter-spacing: 2px;">%s</td></tr>
                    <tr><td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: bold;">TEMPORARY PASSWORD</td><td style="padding: 8px 0; font-size: 16px; color: #0f172a; font-weight: bold; font-family: monospace;">%s</td></tr>
                  </table>
                </div>
                """.formatted(verificationCode, temporaryPassword) : """
                <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                  <table style="width: 100%%; border-collapse: collapse;">
                    <tr><td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: bold;">VERIFICATION CODE</td><td style="padding: 8px 0; font-size: 16px; color: #2563eb; font-weight: 850; letter-spacing: 2px;">%s</td></tr>
                  </table>
                </div>
                """.formatted(verificationCode);

        String htmlContent = credentialSectionHtml + """
                <h3 style="margin: 0 0 12px; color: #0f172a; font-size: 14px; font-weight: 700;">Steps to complete setup:</h3>
                <ol style="margin: 0 0 24px; padding-left: 20px; font-size: 14px; color: #334155; line-height: 1.8;">
                  <li>Visit the <a href="https://rentalhub.com" style="color: #2563eb; text-decoration: none; font-weight: 600;">RentHub homepage</a></li>
                  <li>Click on <strong>Verify Code</strong> in the navigation bar</li>
                  <li>Enter your email and the verification code shown above</li>
                  <li>Choose your permanent password when prompted</li>
                  <li>Log in and start listing your properties</li>
                </ol>
                <div style="border-left: 4px solid #ef4444; padding-left: 16px; margin-bottom: 24px;">
                  <p style="margin: 0; font-size: 13px; color: #b91c1c; font-weight: 600;">Security Reminder:</p>
                  <p style="margin: 4px 0 0; font-size: 13px; color: #dc2626;">Please change your temporary password immediately. Do not share your credentials with anyone.</p>
                </div>
                """;

        String htmlBody = buildEmailHtml("Your Landlord Account is Approved!", "Congratulations! Your landlord registration request has been approved. Use the details below to complete your account setup.", htmlContent);
        sendHtmlEmail(cleanEmail, subject, textBody.toString(), htmlBody);
    }
}
