import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
import datetime

def generate_pdf_report(machine_name: str, inspection_data: dict, filepath: str):
    doc = SimpleDocTemplate(filepath, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []

    # Title
    elements.append(Paragraph(f"Machine Inspection Report: {machine_name}", styles['Title']))
    elements.append(Spacer(1, 12))

    # Date
    elements.append(Paragraph(f"Date: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
    elements.append(Spacer(1, 24))

    # Inspection Data Table
    data = [
        ['Metric', 'Value'],
        ['Status', inspection_data.get('status', 'N/A')],
        ['Anomaly Flag', inspection_data.get('anomaly_flag', 'N/A')],
        ['Dominant Frequency', f"{inspection_data.get('dominant_freq_hz', 0):.2f} Hz"],
        ['Amplitude (px)', f"{inspection_data.get('amplitude_pixels', 0):.2f}"],
        ['RMS (px)', f"{inspection_data.get('rms_pixels', 0):.2f}"]
    ]

    t = Table(data, colWidths=[200, 200])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563EB')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F3F4F6')),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    
    elements.append(t)
    elements.append(Spacer(1, 24))
    
    # Recommendation
    recommendation = "No action required at this time."
    if inspection_data.get('anomaly_flag') in ['Warning', 'Further inspection recommended']:
        recommendation = "URGENT: Anomaly detected. Schedule maintenance immediately to inspect for wear and tear or misalignments."
        
    elements.append(Paragraph("Recommendation & Next Steps:", styles['Heading2']))
    elements.append(Paragraph(recommendation, styles['Normal']))
    
    doc.build(elements)
    return filepath
