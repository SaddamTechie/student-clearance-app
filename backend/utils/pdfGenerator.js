const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateCertificate = async (student) => {
  const dirPath = path.join(__dirname, 'certificates');
  const filePath = path.join(dirPath, `${student.email}_clearance.pdf`);
  
  // Create the 'certificates' directory if it doesn't exist
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  // Create a new PDF document
  const doc = new PDFDocument({
    size: 'A4',
    margins: {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50
    }
  });
  
    // Create write stream and pipe the PDF to it
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);
  
  // Set white background for the main certificate
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#FFFFFF');
  
  // Add a decorative border with primary color
  const borderMargin = 30;
  doc.rect(borderMargin, borderMargin, 
         doc.page.width - 2 * borderMargin, 
         doc.page.height - 2 * borderMargin)
    .lineWidth(3)
    .stroke('#7ABB3B');
  
  // Add secondary border
  const innerBorderMargin = borderMargin + 5;
  doc.rect(innerBorderMargin, innerBorderMargin, 
         doc.page.width - 2 * innerBorderMargin, 
         doc.page.height - 2 * innerBorderMargin)
    .lineWidth(1)
    .stroke('#FF9933');
  
  // Add decorative corners
  const cornerSize = 20;
  // Top-left corner
  drawCorner(doc, borderMargin, borderMargin, cornerSize, true, true);
  // Top-right corner
  drawCorner(doc, doc.page.width - borderMargin, borderMargin, cornerSize, false, true);
  // Bottom-left corner
  drawCorner(doc, borderMargin, doc.page.height - borderMargin, cornerSize, true, false);
  // Bottom-right corner
  drawCorner(doc, doc.page.width - borderMargin, doc.page.height - borderMargin, cornerSize, false, false);
  
  // Add a subtle pattern in the background
  addBackgroundPattern(doc, borderMargin + 10, borderMargin + 10, 
                      doc.page.width - 2 * (borderMargin + 10), 
                      doc.page.height - 2 * (borderMargin + 10));
  
  // ===== LOGO PLACEMENT =====
  const logoPath = path.join(__dirname, '../assets/logo.png'); // Adjust path to your logo
  if (fs.existsSync(logoPath)) {
    // Position the logo at the top center
    const logoWidth = 120; // Adjust size as needed
    const logoX = (doc.page.width - logoWidth) / 2;
    const logoY = borderMargin + 20; // Position after top border
    
    doc.image(logoPath, logoX, logoY, {
      width: logoWidth
    });
    
    // Set y position for next content
    doc.y = logoY + logoWidth * 0.7; // Adjust based on logo aspect ratio
  } else {
    // If logo file doesn't exist, start content a bit lower than the border
    doc.y = borderMargin + 60;
  }
  
  // // Add certificate header with primary color
  // doc.fontSize(14).fillColor('#7ABB3B').text('STUDENT CLEARANCE SYSTEM', {
  //   align: 'center'
  // });
  doc.moveDown(2);
  
  // Add title with a mix of primary and secondary colors
  doc.fontSize(32).fillColor('#7ABB3B').text('CERTIFICATE', {
    align: 'center'
  });
  doc.fontSize(24).fillColor('#FF9933').text('OF CLEARANCE', {
    align: 'center'
  });
  
  doc.moveDown(1);
  
  // Add decorative line
  const lineY = doc.y;
  doc.moveTo(doc.page.width / 4, lineY)
     .lineTo(doc.page.width * 3/4, lineY)
     .lineWidth(2)
     .stroke('#7ABB3B');
  
  doc.moveDown(1.5);
  
  // Add certificate text
  doc.fontSize(14).fillColor('#333333').text('This is to certify that', {
    align: 'center'
  });
  
  doc.moveDown(0.5);
  
  // Student name with larger, bold appearance
  doc.fontSize(24).fillColor('#333333').text(student.name, {
    align: 'center'
  });
  
  doc.moveDown(0.5);
  
  // Student ID
  doc.fontSize(12).fillColor('#666666').text(`Registration.No : ${student.studentId}`, {
    align: 'center'
  });
  
  doc.moveDown(1);
  
  // Certificate message
  doc.fontSize(14).fillColor('#333333').text('has been granted this certificate as confirmation that', {
    align: 'center'
  });
  
  doc.fontSize(18).fillColor('#7ABB3B').text('ALL DEPARTMENTS HAVE BEEN CLEARED', {
    align: 'center'
  });
  
  doc.moveDown(1);
  
  doc.fontSize(12).fillColor('#333333').text('and the student has fulfilled all necessary requirements.', {
    align: 'center'
  });
  
  // Add date
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  });
  
  doc.moveDown(2);
  doc.fontSize(12).fillColor('#666666').text(`Issued on: ${dateString}`, {
    align: 'center'
  });
  
  // Add signature lines
  const signatureY = doc.y + 60;
  const col1 = doc.page.width / 4;
  const col2 = doc.page.width * 3/4;
  
  // First signature
  doc.moveTo(col1 - 70, signatureY)
     .lineTo(col1 + 70, signatureY)
     .lineWidth(1)
     .stroke('#333333');
     
  doc.fontSize(10).fillColor('#666666').text('Registrar', col1 - 70, signatureY + 5, {
    width: 140,
    align: 'center'
  });
  
  // Second signature
  doc.moveTo(col2 - 70, signatureY)
     .lineTo(col2 + 70, signatureY)
     .lineWidth(1)
     .stroke('#333333');
     
  doc.fontSize(10).fillColor('#666666').text('Dean of Students', col2 - 70, signatureY + 5, {
    width: 140,
    align: 'center'
  });
  
  // Add an enhanced decorative seal/badge
  drawEnhancedSeal(doc, doc.page.width / 2, doc.page.height - 120, 55);
  
  // Add footer
  doc.fontSize(10).fillColor('#666666').text('This certificate is computer-generated and requires no physical signature.', {
    align: 'center',
    bottom: doc.page.height - 50
  });
  
  // End the document and save it
  doc.end();

  // Wait for the write stream to finish
  await new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });

  return filePath; // Now safe to return
};

// Function to draw decorative corners
function drawCorner(doc, x, y, size, isLeft, isTop) {
  doc.save();
  doc.strokeColor('#7ABB3B');
  doc.lineWidth(3);
  
  if (isLeft && isTop) {
    // Top left
    doc.moveTo(x, y + size)
       .lineTo(x, y)
       .lineTo(x + size, y);
  } else if (!isLeft && isTop) {
    // Top right
    doc.moveTo(x - size, y)
       .lineTo(x, y)
       .lineTo(x, y + size);
  } else if (isLeft && !isTop) {
    // Bottom left
    doc.moveTo(x, y - size)
       .lineTo(x, y)
       .lineTo(x + size, y);
  } else {
    // Bottom right
    doc.moveTo(x - size, y)
       .lineTo(x, y)
       .lineTo(x, y - size);
  }
  
  doc.stroke();
  doc.restore();
}

// Function to add subtle background pattern
function addBackgroundPattern(doc, x, y, width, height) {
  doc.save();
  
  // Set all line properties once
  doc.strokeColor('#7ABB3B');
  doc.opacity(0.07);
  doc.lineWidth(0.5);
  
  // Diagonal lines pattern
  const spacing = 20;
  
  // Draw all lines in one direction
  for (let i = 0; i < width + height; i += spacing) {
    const startX = x + Math.min(i, width);
    const startY = y;
    const endX = x;
    const endY = y + Math.min(i, height);
    
    if (startX >= x && startY >= y && endX >= x && endY >= y) {
      doc.moveTo(startX, startY)
         .lineTo(endX, endY)
         .stroke();
    }
  }
  
  // Draw all lines in the other direction
  for (let i = 0; i < width + height; i += spacing) {
    const startX = x + Math.max(0, i - height);
    const startY = y + Math.min(i, height);
    const endX = x + Math.min(width, i);
    const endY = y + Math.max(0, i - width);
    
    if (startX >= x && startY >= y && endX >= x && endY >= y) {
      doc.moveTo(startX, startY)
         .lineTo(endX, endY)
         .stroke();
    }
  }
  
  doc.restore();
}

// Enhanced seal/badge with more decorative elements
function drawEnhancedSeal(doc, x, y, radius) {
  doc.save();
  
  // Draw a subtle glow effect (light circular background)
  const gradient = doc.linearGradient(x - radius, y - radius, x + radius, y + radius);
  gradient.stop(0, '#FFFFFF').stop(1, '#F8F8F8');
  doc.circle(x, y, radius + 5).fill(gradient);
  
  // Outer circle with a thicker stroke
  doc.strokeColor('#7ABB3B');
  doc.lineWidth(2.5);
  doc.circle(x, y, radius).stroke();
  
  // Middle circle
  doc.strokeColor('#FF9933');
  doc.lineWidth(1.8);
  doc.circle(x, y, radius - 5).stroke();
  
  // Inner circle
  doc.strokeColor('#7ABB3B');
  doc.lineWidth(0.8);
  doc.circle(x, y, radius - 12).stroke();
  
  // Create decorative star pattern
  doc.strokeColor('#FF9933');
  doc.lineWidth(0.7);
  
  // Draw star points
  const numPoints = 12;
  const outerRadius = radius - 2;
  const innerRadius = radius - 15;
  const angleStep = (Math.PI * 2) / numPoints;
  
  doc.moveTo(x + outerRadius, y);
  
  for (let i = 1; i <= numPoints * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * angleStep) / 2;
    const pointX = x + radius * Math.cos(angle);
    const pointY = y + radius * Math.sin(angle);
    doc.lineTo(pointX, pointY);
  }
  
  doc.closePath().stroke();
  
  // Create a filled badge in the center
  doc.fillColor('#7ABB3B');
  doc.circle(x, y, radius - 20).fill();
  
  // Add "VERIFIED" text with an attractive style
  doc.fillColor('#FFFFFF');
  doc.fontSize(10);
  
  // Draw the text in the center of the badge
  doc.text('VERIFIED', x - 25, y - 6, {
    width: 50,
    align: 'center'
  });
  
  // Add small decorative dots along the outer circle
  doc.fillColor('#FF9933');
  const numDots = 24;
  const dotRadius = 1.2;
  
  for (let i = 0; i < numDots; i++) {
    const angle = i * ((Math.PI * 2) / numDots);
    const dotX = x + (radius + 3) * Math.cos(angle);
    const dotY = y + (radius + 3) * Math.sin(angle);
    
    doc.circle(dotX, dotY, dotRadius).fill();
  }
  
  doc.restore();
}

module.exports = { generateCertificate };