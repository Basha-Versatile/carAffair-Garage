package com.garrage.service;

import com.garrage.model.Garage;
import com.garrage.model.Invoice;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Slf4j
@Service
public class InvoicePdfService {

    // ── Fonts ──
    private static final Font TITLE_FONT = new Font(Font.HELVETICA, 14, Font.BOLD, new Color(30, 30, 30));
    private static final Font SECTION_HEADER_FONT = new Font(Font.HELVETICA, 8, Font.BOLD, new Color(50, 50, 50));
    private static final Font TABLE_HEADER_FONT = new Font(Font.HELVETICA, 8, Font.BOLD, new Color(30, 30, 30));
    private static final Font NORMAL_FONT = new Font(Font.HELVETICA, 8, Font.NORMAL, new Color(50, 50, 50));
    private static final Font BOLD_FONT = new Font(Font.HELVETICA, 8, Font.BOLD, new Color(30, 30, 30));
    private static final Font SMALL_FONT = new Font(Font.HELVETICA, 7, Font.NORMAL, new Color(100, 100, 100));
    private static final Font SMALL_BOLD = new Font(Font.HELVETICA, 7, Font.BOLD, new Color(80, 80, 80));
    private static final Font LABEL_FONT = new Font(Font.HELVETICA, 7, Font.NORMAL, new Color(120, 120, 120));
    private static final Font VALUE_FONT = new Font(Font.HELVETICA, 8, Font.NORMAL, new Color(30, 30, 30));
    private static final Font TOTAL_LABEL = new Font(Font.HELVETICA, 9, Font.BOLD, new Color(30, 30, 30));
    private static final Font TOTAL_VALUE = new Font(Font.HELVETICA, 9, Font.BOLD, new Color(30, 30, 30));
    private static final Font FOOTER_FONT = new Font(Font.HELVETICA, 7, Font.NORMAL, new Color(130, 130, 130));
    private static final Font POWERED_FONT = new Font(Font.HELVETICA, 7, Font.NORMAL, new Color(160, 160, 160));
    private static final Font GARAGE_NAME_FONT = new Font(Font.HELVETICA, 11, Font.BOLD, new Color(30, 30, 30));
    private static final Font GARAGE_DETAIL_FONT = new Font(Font.HELVETICA, 7, Font.NORMAL, new Color(80, 80, 80));

    // ── Colors ──
    private static final Color HEADER_BG = new Color(189, 215, 238);
    private static final Color TABLE_HEADER_BG = new Color(189, 215, 238);
    private static final Color ROW_ALT_BG = new Color(245, 248, 252);
    private static final Color BORDER_CLR = new Color(180, 180, 180);
    private static final Color LIGHT_BORDER = new Color(210, 210, 210);
    private static final Color BLUE_LINE = new Color(37, 99, 235);
    private static final Color SUMMARY_BG = new Color(189, 215, 238);

    private static final NumberFormat INR = NumberFormat.getInstance(new Locale("en", "IN"));

    public byte[] generateInvoicePdf(Invoice invoice, Garage garage) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 30, 30, 30, 30);
            PdfWriter.getInstance(doc, baos);
            doc.open();

            String typeLabel = "proforma".equalsIgnoreCase(invoice.getType()) ? "PROFORMA INVOICE" : "TAX INVOICE";
            String garageName = garage != null ? garage.getName() : "Car Affair";

            // ═══════════════════════════════════════════
            // 1. TITLE BAR
            // ═══════════════════════════════════════════
            PdfPTable titleBar = new PdfPTable(1);
            titleBar.setWidthPercentage(100);
            PdfPCell titleCell = new PdfPCell(new Phrase(typeLabel, TITLE_FONT));
            titleCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            titleCell.setPadding(10);
            titleCell.setBorder(Rectangle.BOX);
            titleCell.setBorderColor(BORDER_CLR);
            titleCell.setBackgroundColor(Color.WHITE);
            titleBar.addCell(titleCell);
            doc.add(titleBar);

            // ═══════════════════════════════════════════
            // 2. GARAGE HEADER (logo block + details)
            // ═══════════════════════════════════════════
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{35, 65});

            // Left: garage name block (dark background, like a logo)
            PdfPCell logoCell = new PdfPCell();
            logoCell.setBorder(Rectangle.BOX);
            logoCell.setBorderColor(BORDER_CLR);
            logoCell.setPadding(12);
            logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            logoCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            logoCell.setBackgroundColor(new Color(20, 20, 20));
            logoCell.setMinimumHeight(55);
            Paragraph logoText = new Paragraph(garageName.toUpperCase(), new Font(Font.HELVETICA, 14, Font.BOLD, Color.WHITE));
            logoText.setAlignment(Element.ALIGN_CENTER);
            logoCell.addElement(logoText);
            headerTable.addCell(logoCell);

            // Right: garage details
            PdfPCell detailsCell = new PdfPCell();
            detailsCell.setBorder(Rectangle.BOX);
            detailsCell.setBorderColor(BORDER_CLR);
            detailsCell.setPadding(8);
            detailsCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            Paragraph gn = new Paragraph(garageName.toUpperCase(), GARAGE_NAME_FONT);
            gn.setAlignment(Element.ALIGN_RIGHT);
            detailsCell.addElement(gn);
            if (garage != null) {
                if (garage.getAddress() != null && !garage.getAddress().isBlank()) {
                    Paragraph addr = new Paragraph(garage.getAddress(), GARAGE_DETAIL_FONT);
                    addr.setAlignment(Element.ALIGN_RIGHT);
                    detailsCell.addElement(addr);
                }
                if (garage.getPhone() != null) {
                    Paragraph ph = new Paragraph("Phone: " + garage.getPhone(), GARAGE_DETAIL_FONT);
                    ph.setAlignment(Element.ALIGN_RIGHT);
                    detailsCell.addElement(ph);
                }
                if (garage.getEmail() != null) {
                    Paragraph em = new Paragraph("Email: " + garage.getEmail(), GARAGE_DETAIL_FONT);
                    em.setAlignment(Element.ALIGN_RIGHT);
                    detailsCell.addElement(em);
                }
                if (garage.getGstNumber() != null && !garage.getGstNumber().isBlank()) {
                    Paragraph gst = new Paragraph("GSTIN: " + garage.getGstNumber(), GARAGE_DETAIL_FONT);
                    gst.setAlignment(Element.ALIGN_RIGHT);
                    detailsCell.addElement(gst);
                }
            }
            headerTable.addCell(detailsCell);
            doc.add(headerTable);

            // ═══════════════════════════════════════════
            // 3. DATE / PLACE OF SUPPLY ROW
            // ═══════════════════════════════════════════
            PdfPTable metaRow = new PdfPTable(2);
            metaRow.setWidthPercentage(100);
            metaRow.setWidths(new float[]{50, 50});

            String dateStr = invoice.getDate() != null ? invoice.getDate()
                    : (invoice.getCreatedAt() != null ? invoice.getCreatedAt().toString().split("T")[0] : "-");

            PdfPCell dateCell = mkCell("Date : " + dateStr, SMALL_BOLD, Element.ALIGN_LEFT);
            dateCell.setBorder(Rectangle.BOX);
            dateCell.setBorderColor(BORDER_CLR);
            dateCell.setPadding(5);
            metaRow.addCell(dateCell);

            String posText = invoice.getPlaceOfSupply() != null ? "Place of Supply : " + invoice.getPlaceOfSupply() : "";
            PdfPCell posCell = mkCell(posText, SMALL_BOLD, Element.ALIGN_RIGHT);
            posCell.setBorder(Rectangle.BOX);
            posCell.setBorderColor(BORDER_CLR);
            posCell.setPadding(5);
            metaRow.addCell(posCell);
            doc.add(metaRow);

            // ═══════════════════════════════════════════
            // 4. CUSTOMER / INVOICE DETAILS
            // ═══════════════════════════════════════════
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setWidths(new float[]{50, 50});

            // Section headers (light blue)
            infoTable.addCell(sectionHeaderCell("CUSTOMER"));
            infoTable.addCell(sectionHeaderCell(typeLabel));

            // Customer details
            PdfPCell custCell = new PdfPCell();
            custCell.setBorder(Rectangle.BOX);
            custCell.setBorderColor(BORDER_CLR);
            custCell.setPadding(6);
            addLabelValue(custCell, "Name", invoice.getCustomerName());
            addLabelValue(custCell, "Phone", invoice.getCustomerPhone());
            infoTable.addCell(custCell);

            // Invoice details
            PdfPCell invCell = new PdfPCell();
            invCell.setBorder(Rectangle.BOX);
            invCell.setBorderColor(BORDER_CLR);
            invCell.setPadding(6);
            addLabelValue(invCell, "Invoice No.", invoice.getInvoiceNumber());
            addLabelValue(invCell, "Date", dateStr);
            addLabelValue(invCell, "Status", invoice.getStatus() != null ? invoice.getStatus().toUpperCase() : "DRAFT");
            addLabelValue(invCell, "Amount", "\u20B9 " + INR.format(invoice.getGrandTotal()));
            infoTable.addCell(invCell);

            doc.add(infoTable);
            doc.add(spacer(8));

            // ═══════════════════════════════════════════
            // 5. ITEMS TABLE (Services + Parts)
            // ═══════════════════════════════════════════
            List<Invoice.InvoiceItem> items = invoice.getItems();
            if (items != null && !items.isEmpty()) {
                List<Invoice.InvoiceItem> services = items.stream()
                        .filter(i -> "service".equals(i.getItemType()))
                        .collect(Collectors.toList());
                List<Invoice.InvoiceItem> parts = items.stream()
                        .filter(i -> "part".equals(i.getItemType()))
                        .collect(Collectors.toList());

                if (!services.isEmpty()) {
                    doc.add(buildItemsSection("SERVICES", services));
                    doc.add(spacer(6));
                }
                if (!parts.isEmpty()) {
                    doc.add(buildItemsSection("PARTS", parts));
                    doc.add(spacer(6));
                }
            }

            // ═══════════════════════════════════════════
            // 6. SUMMARY
            // ═══════════════════════════════════════════
            PdfPTable summaryTable = new PdfPTable(2);
            summaryTable.setWidthPercentage(100);
            summaryTable.setWidths(new float[]{65, 35});

            // Header row
            summaryTable.addCell(sectionHeaderCell(""));
            summaryTable.addCell(sectionHeaderCell("SUMMARY"));

            // Subtotal
            addSummaryRow(summaryTable, "Subtotal", "\u20B9 " + INR.format(invoice.getTotalAmount()));
            // GST
            addSummaryRow(summaryTable, "GST", "\u20B9 " + INR.format(invoice.getGstAmount()));
            // Discount
            if (invoice.getDiscount() > 0) {
                addSummaryRow(summaryTable, "Discount", "- \u20B9 " + INR.format(invoice.getDiscount()));
            }

            // Grand Total row (highlighted)
            PdfPCell gtEmptyCell = mkCell("", NORMAL_FONT, Element.ALIGN_LEFT);
            gtEmptyCell.setBorder(Rectangle.BOX);
            gtEmptyCell.setBorderColor(BORDER_CLR);
            gtEmptyCell.setPadding(6);
            summaryTable.addCell(gtEmptyCell);

            PdfPTable gtInner = new PdfPTable(2);
            gtInner.setWidthPercentage(100);
            gtInner.setWidths(new float[]{50, 50});
            PdfPCell gtL = mkCell("GRAND TOTAL", TOTAL_LABEL, Element.ALIGN_LEFT);
            gtL.setBorder(Rectangle.NO_BORDER);
            gtL.setPadding(4);
            gtInner.addCell(gtL);
            PdfPCell gtV = mkCell("\u20B9 " + INR.format(invoice.getGrandTotal()), TOTAL_VALUE, Element.ALIGN_RIGHT);
            gtV.setBorder(Rectangle.NO_BORDER);
            gtV.setPadding(4);
            gtInner.addCell(gtV);

            PdfPCell gtContainer = new PdfPCell(gtInner);
            gtContainer.setBorder(Rectangle.BOX);
            gtContainer.setBorderColor(BORDER_CLR);
            gtContainer.setPadding(4);
            gtContainer.setBackgroundColor(new Color(230, 240, 250));
            summaryTable.addCell(gtContainer);

            doc.add(summaryTable);
            doc.add(spacer(16));

            // ═══════════════════════════════════════════
            // 7. FOOTER — notes + signature
            // ═══════════════════════════════════════════
            PdfPTable footerTable = new PdfPTable(2);
            footerTable.setWidthPercentage(100);
            footerTable.setWidths(new float[]{65, 35});

            PdfPCell notesCell = new PdfPCell();
            notesCell.setBorder(Rectangle.NO_BORDER);
            notesCell.setPadding(4);
            notesCell.addElement(new Paragraph("Note:", SMALL_BOLD));
            notesCell.addElement(new Paragraph("1. All prices are in Indian Rupees (\u20B9).", FOOTER_FONT));
            notesCell.addElement(new Paragraph("2. This is a computer-generated invoice.", FOOTER_FONT));
            notesCell.addElement(new Paragraph("3. Please check all details before making payment.", FOOTER_FONT));
            footerTable.addCell(notesCell);

            PdfPCell sigCell = new PdfPCell();
            sigCell.setBorder(Rectangle.NO_BORDER);
            sigCell.setPadding(4);
            sigCell.setPaddingTop(28);
            Paragraph sigLine = new Paragraph("____________________________", SMALL_FONT);
            sigLine.setAlignment(Element.ALIGN_RIGHT);
            sigCell.addElement(sigLine);
            Paragraph sigLabel = new Paragraph("Authorized Signatory", SMALL_BOLD);
            sigLabel.setAlignment(Element.ALIGN_RIGHT);
            sigCell.addElement(sigLabel);
            footerTable.addCell(sigCell);

            doc.add(footerTable);
            doc.add(spacer(8));

            // Blue divider
            PdfPTable blueLine = new PdfPTable(1);
            blueLine.setWidthPercentage(100);
            PdfPCell blueCell = new PdfPCell();
            blueCell.setBorder(Rectangle.BOTTOM);
            blueCell.setBorderColor(BLUE_LINE);
            blueCell.setBorderWidth(2);
            blueCell.setFixedHeight(4);
            blueLine.addCell(blueCell);
            doc.add(blueLine);

            Paragraph powered = new Paragraph("(Powered by Car Affair)", POWERED_FONT);
            powered.setAlignment(Element.ALIGN_CENTER);
            powered.setSpacingBefore(4);
            doc.add(powered);

            doc.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate invoice PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate invoice PDF", e);
        }
    }

    // ── Build items section (SERVICES or PARTS) ──
    private PdfPTable buildItemsSection(String title, List<Invoice.InvoiceItem> items) throws DocumentException {
        PdfPTable table = new PdfPTable(8);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{22, 8, 10, 7, 10, 10, 10, 13});

        String[] headers = {title, "HSN/SAC", "RATE", "QTY", "DISC %", "GST %", "GST AMT", "AMOUNT"};
        for (int i = 0; i < headers.length; i++) {
            PdfPCell hc = mkCell(headers[i], TABLE_HEADER_FONT, i == 0 ? Element.ALIGN_LEFT : Element.ALIGN_RIGHT);
            hc.setBackgroundColor(TABLE_HEADER_BG);
            hc.setBorder(Rectangle.BOX);
            hc.setBorderColor(BORDER_CLR);
            hc.setPadding(5);
            table.addCell(hc);
        }

        int idx = 0;
        for (Invoice.InvoiceItem item : items) {
            Color rowBg = idx % 2 == 1 ? ROW_ALT_BG : Color.WHITE;
            String desc = item.getDescription() != null ? item.getDescription() : "-";
            addItemCell(table, desc, NORMAL_FONT, rowBg, Element.ALIGN_LEFT);
            addItemCell(table, item.getHsnSac() != null ? item.getHsnSac() : "-", SMALL_FONT, rowBg, Element.ALIGN_RIGHT);
            addItemCell(table, INR.format(item.getRate()), NORMAL_FONT, rowBg, Element.ALIGN_RIGHT);
            addItemCell(table, String.valueOf(item.getQty()), NORMAL_FONT, rowBg, Element.ALIGN_RIGHT);
            addItemCell(table, item.getDiscount() > 0 ? INR.format(item.getDiscount()) + "%" : "-", NORMAL_FONT, rowBg, Element.ALIGN_RIGHT);
            addItemCell(table, item.getGstRate() > 0 ? INR.format(item.getGstRate()) + "%" : "-", NORMAL_FONT, rowBg, Element.ALIGN_RIGHT);
            addItemCell(table, item.getGstAmount() > 0 ? INR.format(item.getGstAmount()) : "-", NORMAL_FONT, rowBg, Element.ALIGN_RIGHT);
            addItemCell(table, "\u20B9 " + INR.format(item.getAmount()), BOLD_FONT, rowBg, Element.ALIGN_RIGHT);
            idx++;
        }
        return table;
    }

    // ── Helpers ──

    private PdfPCell mkCell(String text, Font font, int align) {
        PdfPCell c = new PdfPCell(new Phrase(text, font));
        c.setHorizontalAlignment(align);
        c.setBorder(Rectangle.NO_BORDER);
        return c;
    }

    private PdfPCell sectionHeaderCell(String text) {
        PdfPCell c = new PdfPCell(new Phrase(text, SECTION_HEADER_FONT));
        c.setBackgroundColor(HEADER_BG);
        c.setBorder(Rectangle.BOX);
        c.setBorderColor(BORDER_CLR);
        c.setPadding(6);
        c.setHorizontalAlignment(Element.ALIGN_LEFT);
        return c;
    }

    private void addItemCell(PdfPTable table, String text, Font font, Color bg, int align) {
        PdfPCell c = new PdfPCell(new Phrase(text, font));
        c.setBackgroundColor(bg);
        c.setPadding(5);
        c.setHorizontalAlignment(align);
        c.setVerticalAlignment(Element.ALIGN_MIDDLE);
        c.setBorder(Rectangle.BOX);
        c.setBorderColor(LIGHT_BORDER);
        table.addCell(c);
    }

    private void addLabelValue(PdfPCell container, String label, String value) {
        if (value == null || value.isBlank()) return;
        Paragraph p = new Paragraph();
        p.add(new Chunk(label + " : ", LABEL_FONT));
        p.add(new Chunk(value, VALUE_FONT));
        p.setSpacingAfter(2);
        container.addElement(p);
    }

    private void addSummaryRow(PdfPTable table, String label, String value) {
        PdfPCell emptyLeft = mkCell("", NORMAL_FONT, Element.ALIGN_LEFT);
        emptyLeft.setBorder(Rectangle.BOX);
        emptyLeft.setBorderColor(BORDER_CLR);
        emptyLeft.setPadding(4);
        table.addCell(emptyLeft);

        PdfPTable inner = new PdfPTable(2);
        inner.setWidthPercentage(100);
        try { inner.setWidths(new float[]{50, 50}); } catch (Exception ignored) {}
        PdfPCell lbl = mkCell(label, NORMAL_FONT, Element.ALIGN_LEFT);
        lbl.setBorder(Rectangle.NO_BORDER);
        lbl.setPadding(3);
        inner.addCell(lbl);
        PdfPCell val = mkCell(value, BOLD_FONT, Element.ALIGN_RIGHT);
        val.setBorder(Rectangle.NO_BORDER);
        val.setPadding(3);
        inner.addCell(val);

        PdfPCell container = new PdfPCell(inner);
        container.setBorder(Rectangle.BOX);
        container.setBorderColor(BORDER_CLR);
        container.setPadding(2);
        table.addCell(container);
    }

    private Paragraph spacer(float height) {
        Paragraph p = new Paragraph(" ");
        p.setSpacingAfter(height);
        return p;
    }
}
