package com.garrage.service;

import com.garrage.model.Garage;
import com.garrage.model.Invoice;
import com.garrage.model.Order;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.openhtmltopdf.svgsupport.BatikSVGDrawer;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class InvoicePdfService {

    private String templateHtml;
    private String logoBase64;

    public InvoicePdfService() {
        loadResources();
    }

    private void loadResources() {
        try (InputStream is = getClass().getResourceAsStream("/templates/invoice.html")) {
            if (is != null) {
                templateHtml = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            } else {
                throw new RuntimeException("Invoice template not found at /templates/invoice.html");
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to load invoice template", e);
        }

        try (InputStream is = getClass().getResourceAsStream("/car.png")) {
            if (is != null) {
                logoBase64 = Base64.getEncoder().encodeToString(is.readAllBytes());
            }
        } catch (Exception ignored) {}
    }

    // ════════════════════════════════════════════
    //  PUBLIC API
    // ════════════════════════════════════════════

    public byte[] generateInvoicePdf(Invoice invoice, Garage garage) {
        String html = buildInvoiceHtml(invoice, garage);
        return renderPdf(html);
    }

    public byte[] generateEstimatePdf(Order order, Garage garage) {
        String html = buildEstimateHtml(order, garage);
        return renderPdf(html);
    }

    // ════════════════════════════════════════════
    //  HTML BUILDER — Invoice
    // ════════════════════════════════════════════

    private String buildInvoiceHtml(Invoice invoice, Garage garage) {
        List<Invoice.InvoiceItem> items = invoice.getItems() != null ? invoice.getItems() : List.of();
        List<Invoice.InvoiceItem> svcs = items.stream().filter(i -> "service".equalsIgnoreCase(i.getItemType())).collect(Collectors.toList());
        List<Invoice.InvoiceItem> parts = items.stream().filter(i -> "part".equalsIgnoreCase(i.getItemType())).collect(Collectors.toList());

        double svcsTotal = svcs.stream().mapToDouble(Invoice.InvoiceItem::getAmount).sum();
        double partsTotal = parts.stream().mapToDouble(Invoice.InvoiceItem::getAmount).sum();
        double itemsTotal = svcsTotal + partsTotal;
        int svcsPct = itemsTotal > 0 ? (int) Math.round(svcsTotal * 100.0 / itemsTotal) : 0;
        int partsPct = 100 - svcsPct;

        String itemRows = buildInvoiceItemRows(items);
        String barChartHtml = buildInvoiceBarChart(items, itemsTotal);
        String summaryRows = buildInvoiceSummaryRows(invoice);

        String typeLabel = "tax".equalsIgnoreCase(invoice.getType()) ? "Tax Invoice" : "Proforma Invoice";
        String statusText = capitalize(invoice.getStatus());

        String notes;
        if ("tax".equalsIgnoreCase(invoice.getType())) {
            notes = "All prices are in Indian Rupees (INR). This is a computer generated invoice. "
                  + "Please verify all details before making payment.";
        } else {
            notes = "This is a proforma invoice and not a tax invoice. Goods and services remain "
                  + "the property of " + safe(garage.getName()) + " until full payment is received.";
        }

        String taxSummary;
        if (invoice.getGstAmount() > 0) {
            taxSummary = "incl. Rs. " + fmt(invoice.getGstAmount()) + " GST";
        } else {
            taxSummary = "0% tax applied";
        }

        return replacePlaceholders(templateHtml, garage, typeLabel, statusText,
                safe(invoice.getInvoiceNumber()), safe(invoice.getDate()),
                safe(invoice.getCustomerName()), safe(invoice.getCustomerPhone()),
                invoice.getPlaceOfSupply(),
                svcsTotal, svcs.size(), svcsPct,
                partsTotal, parts.size(), partsPct,
                invoice.getGrandTotal(), taxSummary,
                invoice.getTotalAmount(), invoice.getGrandTotal(),
                itemRows, barChartHtml, summaryRows, notes);
    }

    // ════════════════════════════════════════════
    //  HTML BUILDER — Estimate (from Order)
    // ════════════════════════════════════════════

    private String buildEstimateHtml(Order order, Garage garage) {
        List<Order.OrderLineItem> items = order.getLineItems() != null ? order.getLineItems() : List.of();
        List<Order.OrderLineItem> svcs = items.stream().filter(i -> "service".equalsIgnoreCase(i.getItemType())).collect(Collectors.toList());
        List<Order.OrderLineItem> parts = items.stream().filter(i -> "part".equalsIgnoreCase(i.getItemType())).collect(Collectors.toList());

        double svcsTotal = svcs.stream().mapToDouble(Order.OrderLineItem::getAmount).sum();
        double partsTotal = parts.stream().mapToDouble(Order.OrderLineItem::getAmount).sum();
        double itemsTotal = svcsTotal + partsTotal;
        int svcsPct = itemsTotal > 0 ? (int) Math.round(svcsTotal * 100.0 / itemsTotal) : 0;
        int partsPct = 100 - svcsPct;

        String itemRows = buildOrderItemRows(items);
        String barChartHtml = buildOrderBarChart(items, itemsTotal);
        String summaryRows = buildOrderSummaryRows(order);

        String typeLabel = "gst".equalsIgnoreCase(order.getEstimateType()) ? "GST Estimate" : "Proforma Estimate";
        String statusText = capitalize(order.getStatus());
        String identifier = safe(order.getJobCard());

        String notes = "This is an estimate and not a final invoice. Actual charges may vary based on "
                     + "additional parts or services required during repair. Please review and approve to proceed.";

        String taxSummary;
        if (order.getTotalGst() > 0) {
            taxSummary = "incl. Rs. " + fmt(order.getTotalGst()) + " GST";
        } else {
            taxSummary = "0% tax applied";
        }

        return replacePlaceholders(templateHtml, garage, typeLabel, statusText,
                identifier, safe(order.getDate()),
                safe(order.getCustomerName()), safe(order.getCustomerPhone()),
                order.getPlaceOfSupply(),
                svcsTotal, svcs.size(), svcsPct,
                partsTotal, parts.size(), partsPct,
                order.getGrandTotal(), taxSummary,
                order.getSubtotal(), order.getGrandTotal(),
                itemRows, barChartHtml, summaryRows, notes);
    }

    // ════════════════════════════════════════════
    //  COMMON PLACEHOLDER REPLACEMENT
    // ════════════════════════════════════════════

    private String replacePlaceholders(String tmpl, Garage garage,
            String typeLabel, String statusText, String number, String date,
            String custName, String custPhone, String placeOfSupply,
            double svcsTotal, int svcsCount, int svcsPct,
            double partsTotal, int partsCount, int partsPct,
            double grandTotal, String taxSummary,
            double subtotal, double grandTotalLg,
            String itemRows, String barChartHtml, String summaryRows, String notes) {

        String html = tmpl;
        html = html.replace("${logoHtml}", buildLogoHtml());
        html = html.replace("${garageName}", esc(safe(garage.getName())));
        html = html.replace("${garageAddress}", esc(buildAddress(garage)));
        html = html.replace("${gstinHtml}", buildGstinHtml(garage));
        html = html.replace("${statusText}", esc(statusText));
        html = html.replace("${invoiceType}", esc(typeLabel));
        html = html.replace("${invoiceNumber}", esc(number));
        html = html.replace("${invoiceDate}", esc(date));
        html = html.replace("${customerName}", esc(custName));
        html = html.replace("${customerPhone}", esc(custPhone));
        html = html.replace("${placeOfSupplyHtml}", buildPlaceHtml(placeOfSupply));
        html = html.replace("${servicesTotalFmt}", "Rs. " + fmt(svcsTotal));
        html = html.replace("${servicesCount}", String.valueOf(svcsCount));
        html = html.replace("${servicesBarPct}", String.valueOf(svcsPct));
        html = html.replace("${partsTotalFmt}", "Rs. " + fmt(partsTotal));
        html = html.replace("${partsCount}", String.valueOf(partsCount));
        html = html.replace("${partsBarPct}", String.valueOf(partsPct));
        html = html.replace("${grandTotalFmt}", "Rs. " + fmt(grandTotal));
        html = html.replace("${taxSummary}", esc(taxSummary));
        html = html.replace("${donutSvg}", buildDonutSvg(svcsPct, partsPct, grandTotal));
        html = html.replace("${barChartHtml}", barChartHtml);
        html = html.replace("${itemRows}", itemRows);
        html = html.replace("${subtotalFmt}", "Rs. " + fmt(subtotal));
        html = html.replace("${summaryRows}", summaryRows);
        html = html.replace("${grandTotalLg}", "Rs. " + fmt(grandTotalLg));
        html = html.replace("${notesText}", esc(notes));
        html = html.replace("${signName}", esc(safe(garage.getName())));

        return html;
    }

    // ════════════════════════════════════════════
    //  DYNAMIC HTML FRAGMENTS
    // ════════════════════════════════════════════

    private String buildDonutSvg(int svcsPct, int partsPct, double grandTotal) {
        double cx = 18, cy = 18, r = 15.9155;
        String totalShort = "Rs. " + fmtShort(grandTotal);

        StringBuilder svg = new StringBuilder();
        svg.append("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"100\" viewBox=\"0 0 36 36\">\n");

        // Background circle
        svg.append("<circle cx=\"18\" cy=\"18\" r=\"15.9155\" fill=\"none\" stroke=\"#FCE4EC\" stroke-width=\"3.4\"/>\n");

        if (svcsPct > 0 && svcsPct < 100) {
            double svcsAngle = svcsPct * 3.6;
            svg.append(arcPath(cx, cy, r, -90, -90 + svcsAngle, "#C0392B", 3.4));
            svg.append(arcPath(cx, cy, r, -90 + svcsAngle, -90 + 360, "#C4A09C", 3.4));
        } else if (svcsPct >= 100) {
            svg.append("<circle cx=\"18\" cy=\"18\" r=\"15.9155\" fill=\"none\" stroke=\"#C0392B\" stroke-width=\"3.4\"/>\n");
        } else {
            svg.append("<circle cx=\"18\" cy=\"18\" r=\"15.9155\" fill=\"none\" stroke=\"#C4A09C\" stroke-width=\"3.4\"/>\n");
        }

        // Center text
        svg.append("<text x=\"18\" y=\"16.5\" text-anchor=\"middle\" font-size=\"3\" fill=\"#9CA3AF\" font-weight=\"bold\">Total</text>\n");
        svg.append("<text x=\"18\" y=\"20\" text-anchor=\"middle\" font-size=\"3.5\" fill=\"#111827\" font-weight=\"bold\">")
           .append(esc(totalShort)).append("</text>\n");
        svg.append("</svg>\n");

        // Legend below donut
        svg.append("<div class=\"legend\">");
        svg.append("<span class=\"legend-dot dot-svc\"> </span><span class=\"legend-text\">Services ").append(svcsPct).append("%</span>");
        svg.append("<span class=\"legend-dot dot-part\"> </span><span class=\"legend-text\">Parts ").append(partsPct).append("%</span>");
        svg.append("</div>");

        return svg.toString();
    }

    private String arcPath(double cx, double cy, double r, double startDeg, double endDeg, String color, double sw) {
        double s = Math.toRadians(startDeg);
        double e = Math.toRadians(endDeg);
        double x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
        double x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
        int largeArc = (endDeg - startDeg) > 180 ? 1 : 0;
        return String.format(java.util.Locale.US,
            "<path d=\"M %.4f %.4f A %.4f %.4f 0 %d 1 %.4f %.4f\" fill=\"none\" stroke=\"%s\" stroke-width=\"%.1f\" stroke-linecap=\"round\"/>\n",
            x1, y1, r, r, largeArc, x2, y2, color, sw);
    }

    private String buildLogoHtml() {
        if (logoBase64 != null) {
            return "<img src=\"data:image/png;base64," + logoBase64
                 + "\" style=\"width:30pt;height:30pt;border-radius:6pt;\"/>";
        }
        return "<div style=\"width:32pt;height:32pt;background-color:#C0392B;border-radius:6pt;"
             + "color:#fff;font-weight:bold;font-size:11pt;text-align:center;padding-top:8pt;\">CA</div>";
    }

    private String buildGstinHtml(Garage garage) {
        if (garage.getGstNumber() != null && !garage.getGstNumber().isBlank()) {
            return "<div class=\"garage-gstin\">GSTIN &#183; " + esc(garage.getGstNumber()) + "</div>";
        }
        return "";
    }

    private String buildAddress(Garage garage) {
        StringBuilder sb = new StringBuilder();
        if (garage.getStreetAddress() != null && !garage.getStreetAddress().isBlank()) {
            sb.append(garage.getStreetAddress());
        } else if (garage.getAddress() != null && !garage.getAddress().isBlank()) {
            sb.append(garage.getAddress());
        }
        if (garage.getCity() != null && !garage.getCity().isBlank()) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(garage.getCity());
        }
        if (garage.getState() != null && !garage.getState().isBlank()) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(garage.getState());
        }
        return sb.toString();
    }

    private String buildPlaceHtml(String place) {
        if (place != null && !place.isBlank()) {
            return "<div class=\"place-badge\">" + esc(place) + "</div>";
        }
        return "";
    }

    // ── Invoice item rows ──

    private String buildInvoiceItemRows(List<Invoice.InvoiceItem> items) {
        StringBuilder sb = new StringBuilder();
        for (Invoice.InvoiceItem item : items) {
            boolean isSvc = "service".equalsIgnoreCase(item.getItemType());
            sb.append("<tr>")
              .append("<td class=\"item-name\">").append(esc(item.getDescription())).append("</td>")
              .append("<td><span class=\"").append(isSvc ? "badge-svc" : "badge-part").append("\">")
              .append(isSvc ? "Service" : "Part").append("</span></td>")
              .append("<td class=\"text-center mono\">").append(item.getQty()).append("</td>")
              .append("<td class=\"text-right mono text-muted\">Rs. ").append(fmt(item.getRate())).append("</td>")
              .append("<td class=\"text-right mono text-dark\">Rs. ").append(fmt(item.getAmount())).append("</td>")
              .append("</tr>\n");
        }
        return sb.toString();
    }

    private String buildInvoiceBarChart(List<Invoice.InvoiceItem> items, double total) {
        if (total <= 0) return "";
        List<Invoice.InvoiceItem> sorted = items.stream()
                .sorted((a, b) -> Double.compare(b.getAmount(), a.getAmount()))
                .limit(6)
                .collect(Collectors.toList());

        StringBuilder sb = new StringBuilder();
        for (Invoice.InvoiceItem item : sorted) {
            double pct = item.getAmount() * 100.0 / total;
            boolean isSvc = "service".equalsIgnoreCase(item.getItemType());
            sb.append("<div class=\"bar-item\">")
              .append("<table class=\"bar-item-table\"><tr>")
              .append("<td class=\"bar-item-name\">").append(esc(item.getDescription())).append("</td>")
              .append("<td class=\"bar-item-value\">Rs. ").append(fmt(item.getAmount())).append("</td>")
              .append("</tr></table>")
              .append("<div class=\"bar-lg-track\"><div class=\"").append(isSvc ? "bar-lg-svc" : "bar-lg-part")
              .append("\" style=\"width: ").append(String.format("%.1f", pct)).append("%;\"> </div></div>")
              .append("</div>\n");
        }
        return sb.toString();
    }

    private String buildInvoiceSummaryRows(Invoice invoice) {
        StringBuilder sb = new StringBuilder();
        if (invoice.getGstAmount() > 0) {
            sb.append("<tr><td class=\"total-label\">GST</td>")
              .append("<td class=\"total-value mono\">Rs. ").append(fmt(invoice.getGstAmount())).append("</td></tr>\n");
        }
        if (invoice.getDiscount() > 0) {
            sb.append("<tr><td class=\"total-label\">Discount</td>")
              .append("<td class=\"total-value mono\">- Rs. ").append(fmt(invoice.getDiscount())).append("</td></tr>\n");
        }
        return sb.toString();
    }

    // ── Order item rows (for estimates) ──

    private String buildOrderItemRows(List<Order.OrderLineItem> items) {
        StringBuilder sb = new StringBuilder();
        for (Order.OrderLineItem item : items) {
            boolean isSvc = "service".equalsIgnoreCase(item.getItemType());
            sb.append("<tr>")
              .append("<td class=\"item-name\">").append(esc(item.getDescription())).append("</td>")
              .append("<td><span class=\"").append(isSvc ? "badge-svc" : "badge-part").append("\">")
              .append(isSvc ? "Service" : "Part").append("</span></td>")
              .append("<td class=\"text-center mono\">").append(item.getQty()).append("</td>")
              .append("<td class=\"text-right mono text-muted\">Rs. ").append(fmt(item.getRate())).append("</td>")
              .append("<td class=\"text-right mono text-dark\">Rs. ").append(fmt(item.getAmount())).append("</td>")
              .append("</tr>\n");
        }
        return sb.toString();
    }

    private String buildOrderBarChart(List<Order.OrderLineItem> items, double total) {
        if (total <= 0) return "";
        List<Order.OrderLineItem> sorted = items.stream()
                .sorted((a, b) -> Double.compare(b.getAmount(), a.getAmount()))
                .limit(6)
                .collect(Collectors.toList());

        StringBuilder sb = new StringBuilder();
        for (Order.OrderLineItem item : sorted) {
            double pct = item.getAmount() * 100.0 / total;
            boolean isSvc = "service".equalsIgnoreCase(item.getItemType());
            sb.append("<div class=\"bar-item\">")
              .append("<table class=\"bar-item-table\"><tr>")
              .append("<td class=\"bar-item-name\">").append(esc(item.getDescription())).append("</td>")
              .append("<td class=\"bar-item-value\">Rs. ").append(fmt(item.getAmount())).append("</td>")
              .append("</tr></table>")
              .append("<div class=\"bar-lg-track\"><div class=\"").append(isSvc ? "bar-lg-svc" : "bar-lg-part")
              .append("\" style=\"width: ").append(String.format("%.1f", pct)).append("%;\"> </div></div>")
              .append("</div>\n");
        }
        return sb.toString();
    }

    private String buildOrderSummaryRows(Order order) {
        StringBuilder sb = new StringBuilder();
        if (order.getTotalGst() > 0) {
            sb.append("<tr><td class=\"total-label\">GST</td>")
              .append("<td class=\"total-value mono\">Rs. ").append(fmt(order.getTotalGst())).append("</td></tr>\n");
        }
        if (order.getDiscountAmount() > 0) {
            sb.append("<tr><td class=\"total-label\">Discount</td>")
              .append("<td class=\"total-value mono\">- Rs. ").append(fmt(order.getDiscountAmount())).append("</td></tr>\n");
        }
        return sb.toString();
    }

    // ════════════════════════════════════════════
    //  PDF RENDERER
    // ════════════════════════════════════════════

    private byte[] renderPdf(String html) {
        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.useSVGDrawer(new BatikSVGDrawer());
            builder.withHtmlContent(html, null);
            builder.toStream(os);
            builder.run();
            return os.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to render invoice PDF: " + e.getMessage(), e);
        }
    }

    // ════════════════════════════════════════════
    //  UTILITIES
    // ════════════════════════════════════════════

    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    private static String safe(String s) {
        return s != null ? s : "";
    }

    private static String capitalize(String s) {
        if (s == null || s.isEmpty()) return "Draft";
        return s.substring(0, 1).toUpperCase() + s.substring(1).toLowerCase();
    }

    private static String fmt(double v) {
        return String.format("%,.2f", v);
    }

    private static String fmtShort(double v) {
        if (v >= 100000) return String.format("%.1fL", v / 100000);
        if (v >= 1000)   return String.format("%.1fk", v / 1000);
        return String.format("%.0f", v);
    }
}
