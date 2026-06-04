package com.garrage;
import com.garrage.model.Garage;
import com.garrage.model.Invoice;
import com.garrage.service.InvoicePdfService;
import java.io.FileOutputStream;
import java.time.LocalDateTime;
import java.util.List;
public class TestPdfGen {
    public static void main(String[] args) throws Exception {
        InvoicePdfService svc = new InvoicePdfService();
        Garage garage = Garage.builder().name("Rajesh Auto Care").address("Plot 45, KPHB Colony")
                .city("Hyderabad").state("Telangana").phone("+91 9876543210")
                .email("info@rajeshautocare.in").gstNumber("36AAACR5055K1Z5").build();
        Invoice invoice = Invoice.builder().invoiceNumber("INV-2026-0042").type("tax")
                .customerName("Srinivas Koratala").customerPhone("+91 9123456789")
                .date("2026-06-04").placeOfSupply("Telangana").status("paid")
                .items(List.of(
                    Invoice.InvoiceItem.builder().itemType("service").description("Full Car Service").hsnSac("998714").qty(1).rate(3500).discount(5).amount(3325).gstRate(18).gstAmount(598.50).build(),
                    Invoice.InvoiceItem.builder().itemType("service").description("AC Gas Refill").hsnSac("998714").qty(1).rate(1800).discount(0).amount(1800).gstRate(18).gstAmount(324).build(),
                    Invoice.InvoiceItem.builder().itemType("service").description("Wheel Alignment & Balancing").hsnSac("998714").qty(1).rate(800).discount(0).amount(800).gstRate(18).gstAmount(144).build(),
                    Invoice.InvoiceItem.builder().itemType("part").description("Engine Oil 5W-30 (4L)").hsnSac("27101990").qty(1).rate(2200).discount(0).amount(2200).gstRate(28).gstAmount(616).build(),
                    Invoice.InvoiceItem.builder().itemType("part").description("Oil Filter").hsnSac("84212300").qty(1).rate(450).discount(0).amount(450).gstRate(28).gstAmount(126).build(),
                    Invoice.InvoiceItem.builder().itemType("part").description("AC Compressor Gas R134a").hsnSac("29034100").qty(2).rate(650).discount(10).amount(1170).gstRate(18).gstAmount(210.60).build()
                )).totalAmount(9745).gstAmount(2019.10).discount(200).grandTotal(11564.10).createdAt(LocalDateTime.now()).build();
        byte[] pdf = svc.generateInvoicePdf(invoice, garage);
        try (FileOutputStream fos = new FileOutputStream("target/sample-invoice.pdf")) { fos.write(pdf); }
        System.out.println("OK: " + pdf.length + " bytes");
    }
}
