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
    public void sendGarageApprovalEmail(String toEmail, String garageName, String ownerName, String phone) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject("Your Garage Registration Has Been Approved — Car Affair");

            String loginUrl = "http://localhost:3000/login";

            String html = "<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'>"
                    + "<div style='background:#16a34a;color:white;padding:24px;text-align:center;border-radius:8px 8px 0 0'>"
                    + "<h1 style='margin:0;font-size:22px'>Registration Approved!</h1>"
                    + "</div>"
                    + "<div style='padding:24px;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 8px 8px'>"
                    + "<p>Hi <b>" + ownerName + "</b>,</p>"
                    + "<p>Great news! Your garage <b>" + garageName + "</b> has been approved and registered on Car Affair.</p>"
                    + "<p>You can now log in using your phone number <b>" + phone + "</b> with OTP verification and start managing your garage.</p>"
                    + "<div style='text-align:center;margin:24px 0'>"
                    + "<a href='" + loginUrl + "' style='display:inline-block;padding:14px 32px;background:#16a34a;color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px'>Login to Your Dashboard</a>"
                    + "</div>"
                    + "<div style='background:#f0fdf4;border-radius:8px;padding:16px;margin:16px 0'>"
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
            log.info("Approval email sent to {} for garage {}", toEmail, garageName);
        } catch (Exception e) {
            log.error("Failed to send approval email to {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendGarageRejectionEmail(String toEmail, String garageName, String ownerName, String reason) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject("Update on Your Garage Registration — Car Affair");

            String reasonBlock = (reason != null && !reason.isBlank())
                    ? "<div style='background:#fef2f2;border-left:4px solid #ef4444;border-radius:4px;padding:12px 16px;margin:16px 0'>"
                      + "<p style='margin:0;font-size:14px;color:#991b1b'><b>Reason:</b> " + reason + "</p></div>"
                    : "";

            String html = "<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'>"
                    + "<div style='background:#dc2626;color:white;padding:24px;text-align:center;border-radius:8px 8px 0 0'>"
                    + "<h1 style='margin:0;font-size:22px'>Registration Update</h1>"
                    + "</div>"
                    + "<div style='padding:24px;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 8px 8px'>"
                    + "<p>Hi <b>" + ownerName + "</b>,</p>"
                    + "<p>Thank you for your interest in joining Car Affair. After reviewing your registration for <b>" + garageName + "</b>, we are unable to approve it at this time.</p>"
                    + reasonBlock
                    + "<p>If you believe this was in error or would like to reapply with updated information, please feel free to submit a new registration.</p>"
                    + "<p style='color:#64748b;font-size:13px'>For any queries, please contact our support team.</p>"
                    + "<p>Best regards,<br><b>Car Affair Team</b></p>"
                    + "</div></div>";

            helper.setText(html, true);
            mailSender.send(message);
            log.info("Rejection email sent to {} for garage {}", toEmail, garageName);
        } catch (Exception e) {
            log.error("Failed to send rejection email to {}: {}", toEmail, e.getMessage());
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

    @Async
    public void sendEstimateEmail(String toEmail, String customerName, String jobCard,
                                   String garageName, String vehicle, double grandTotal,
                                   String estimateToken) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject("Repair Estimate for " + vehicle + " — " + garageName);

            String estimateUrl = "http://localhost:3000/estimate/" + estimateToken;
            String formattedAmount = String.format("%,.2f", grandTotal);

            String html = "<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'>"
                    + "<div style='background:#2563eb;color:white;padding:24px;text-align:center;border-radius:8px 8px 0 0'>"
                    + "<h1 style='margin:0;font-size:22px'>" + garageName + "</h1>"
                    + "<p style='margin:4px 0 0;font-size:13px;opacity:0.9'>Repair Estimate</p>"
                    + "</div>"
                    + "<div style='padding:24px;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 8px 8px'>"
                    + "<p>Dear <b>" + customerName + "</b>,</p>"
                    + "<p>We have prepared a repair estimate for your vehicle <b>" + vehicle + "</b> (Job Card: <b>" + jobCard + "</b>).</p>"
                    + "<div style='background:#f8fafc;border-radius:8px;padding:20px;margin:16px 0;text-align:center'>"
                    + "<p style='margin:0;font-size:13px;color:#64748b'>Estimated Amount</p>"
                    + "<p style='margin:4px 0 0;font-size:28px;font-weight:700;color:#1e293b'>&#8377;" + formattedAmount + "</p>"
                    + "</div>"
                    + "<div style='text-align:center;margin:24px 0'>"
                    + "<a href='" + estimateUrl + "' style='display:inline-block;padding:14px 40px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px'>View Estimate</a>"
                    + "</div>"
                    + "<p style='color:#64748b;font-size:13px;text-align:center'>Click the button above to review the estimate and approve or reject it.</p>"
                    + "<p style='color:#64748b;font-size:12px;margin-top:20px'>If you have any questions, please contact us directly.</p>"
                    + "<p>Thank you,<br><b>" + garageName + "</b></p>"
                    + "</div></div>";

            helper.setText(html, true);
            mailSender.send(message);
            log.info("Estimate email sent to {} for order {}", toEmail, jobCard);
        } catch (Exception e) {
            log.error("Failed to send estimate email to {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendPaymentEmail(String toEmail, String customerName, String jobCard,
                                  String garageName, double amount, String paymentToken) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject("Payment Due for " + jobCard + " — " + garageName);

            String paymentUrl = "http://localhost:3000/payment/" + paymentToken;
            String formattedAmount = String.format("%,.2f", amount);

            String html = "<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'>"
                    + "<div style='background:#2563eb;color:white;padding:24px;text-align:center;border-radius:8px 8px 0 0'>"
                    + "<h1 style='margin:0;font-size:22px'>" + garageName + "</h1>"
                    + "<p style='margin:4px 0 0;font-size:13px;opacity:0.9'>Service Payment</p>"
                    + "</div>"
                    + "<div style='padding:24px;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 8px 8px'>"
                    + "<p>Dear <b>" + customerName + "</b>,</p>"
                    + "<p>Your vehicle service for order <b>" + jobCard + "</b> has been completed.</p>"
                    + "<div style='background:#f8fafc;border-radius:8px;padding:20px;margin:16px 0;text-align:center'>"
                    + "<p style='margin:0;font-size:13px;color:#64748b'>Amount Due</p>"
                    + "<p style='margin:4px 0 0;font-size:28px;font-weight:700;color:#1e293b'>&#8377;" + formattedAmount + "</p>"
                    + "</div>"
                    + "<div style='text-align:center;margin:24px 0'>"
                    + "<a href='" + paymentUrl + "' style='display:inline-block;padding:14px 40px;background:#16a34a;color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px'>Pay Now</a>"
                    + "</div>"
                    + "<p style='color:#64748b;font-size:13px;text-align:center'>Click the button above to view details and confirm payment.</p>"
                    + "<p style='color:#64748b;font-size:12px;margin-top:20px'>If you have any questions about this bill, please contact us directly.</p>"
                    + "<p>Thank you,<br><b>" + garageName + "</b></p>"
                    + "</div></div>";

            helper.setText(html, true);
            mailSender.send(message);
            log.info("Payment email sent to {} for order {}", toEmail, jobCard);
        } catch (Exception e) {
            log.error("Failed to send payment email to {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendThankYouInvoiceEmail(String toEmail, String customerName, String invoiceNumber,
                                          String garageName, byte[] pdfBytes) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject("Thank You for Visiting " + garageName + " — Invoice " + invoiceNumber);

            String html = "<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'>"
                    + "<div style='background:#16a34a;color:white;padding:24px;text-align:center;border-radius:8px 8px 0 0'>"
                    + "<h1 style='margin:0;font-size:22px'>Thank You!</h1>"
                    + "<p style='margin:4px 0 0;font-size:13px;opacity:0.9'>" + garageName + "</p>"
                    + "</div>"
                    + "<div style='padding:24px;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 8px 8px'>"
                    + "<p>Dear <b>" + customerName + "</b>,</p>"
                    + "<p>Thank you for visiting <b>" + garageName + "</b>! Your payment has been received successfully.</p>"
                    + "<p>Please find your invoice <b>" + invoiceNumber + "</b> attached to this email for your records.</p>"
                    + "<div style='background:#f0fdf4;border-radius:8px;padding:16px;margin:16px 0;text-align:center'>"
                    + "<p style='margin:0;font-size:14px;color:#166534'>&#10003; Payment Confirmed</p>"
                    + "</div>"
                    + "<p>We hope you had a great experience. We look forward to serving you again!</p>"
                    + "<p style='color:#64748b;font-size:13px'>This is an auto-generated email from Car Affair.</p>"
                    + "<p>Warm regards,<br><b>" + garageName + "</b></p>"
                    + "</div></div>";

            helper.setText(html, true);
            helper.addAttachment(invoiceNumber + ".pdf", new ByteArrayResource(pdfBytes), "application/pdf");
            mailSender.send(message);
            log.info("Thank you invoice email sent to {} for invoice {}", toEmail, invoiceNumber);
        } catch (Exception e) {
            log.error("Failed to send thank you invoice email to {}: {}", toEmail, e.getMessage());
        }
    }
}
