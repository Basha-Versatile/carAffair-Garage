package com.garrage.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:help@vercommerce.co.uk}")
    private String fromAddress;

    @Async
    public void sendGarageWelcomeEmail(String toEmail, String garageName, String ownerName, String phone) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject("Welcome to Car Affair - " + garageName);

            String html = "<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'>"
                    + "<div style='background:#2563eb;color:white;padding:24px;text-align:center;border-radius:8px 8px 0 0'>"
                    + "<h1 style='margin:0;font-size:22px'>Welcome to Car Affair</h1>"
                    + "</div>"
                    + "<div style='padding:24px;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 8px 8px'>"
                    + "<p>Hi <b>" + ownerName + "</b>,</p>"
                    + "<p>Your garage <b>" + garageName + "</b> has been successfully registered on Car Affair.</p>"
                    + "<p>You can now log in using your phone number <b>" + phone + "</b> and start managing your garage.</p>"
                    + "<div style='background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0'>"
                    + "<p style='margin:0 0 8px;font-weight:600'>Quick Start:</p>"
                    + "<ul style='margin:0;padding-left:20px'>"
                    + "<li>Add your customers and vehicles</li>"
                    + "<li>Create repair orders and invoices</li>"
                    + "<li>Manage your parts inventory</li>"
                    + "<li>Track service reminders</li>"
                    + "</ul>"
                    + "</div>"
                    + "<p style='color:#64748b;font-size:13px'>If you have any questions, please contact our support team.</p>"
                    + "<p>Best regards,<br><b>Car Affair Team</b></p>"
                    + "</div></div>";

            helper.setText(html, true);
            mailSender.send(message);
            log.info("Welcome email sent to {} for garage {}", toEmail, garageName);
        } catch (Exception e) {
            log.error("Failed to send welcome email to {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendInvoiceEmail(String toEmail, String customerName, String invoiceNumber,
                                  String garageName, byte[] pdfBytes) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject("Invoice " + invoiceNumber + " from " + garageName);

            String html = "<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'>"
                    + "<div style='background:#2563eb;color:white;padding:24px;text-align:center;border-radius:8px 8px 0 0'>"
                    + "<h1 style='margin:0;font-size:22px'>" + garageName + "</h1>"
                    + "</div>"
                    + "<div style='padding:24px;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 8px 8px'>"
                    + "<p>Dear <b>" + customerName + "</b>,</p>"
                    + "<p>Please find attached your invoice <b>" + invoiceNumber + "</b>.</p>"
                    + "<p>Thank you for choosing our services.</p>"
                    + "<p style='color:#64748b;font-size:13px'>This is an auto-generated email from Car Affair.</p>"
                    + "<p>Regards,<br><b>" + garageName + "</b></p>"
                    + "</div></div>";

            helper.setText(html, true);
            helper.addAttachment(invoiceNumber + ".pdf", new ByteArrayResource(pdfBytes), "application/pdf");
            mailSender.send(message);
            log.info("Invoice email sent to {} for invoice {}", toEmail, invoiceNumber);
        } catch (Exception e) {
            log.error("Failed to send invoice email to {}: {}", toEmail, e.getMessage());
        }
    }
}
