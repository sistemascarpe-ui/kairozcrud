import { useState } from 'react';
import jsPDF from 'jspdf';

export const useSimplePDFReport = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async (inventoryData) => {
    setIsGenerating(true);
    
    try {
      // Crear nuevo documento PDF
      const doc = new jsPDF();
      
      // Configuración de colores
      const primaryColor = [59, 130, 246]; // Azul
      const secondaryColor = [107, 114, 128]; // Gris
      const successColor = [34, 197, 94]; // Verde
      const dangerColor = [239, 68, 68]; // Rojo
      
      let yPosition = 20;
      
      // Función para agregar texto con estilo
      const addText = (text, x, y, options = {}) => {
        doc.setFontSize(options.fontSize || 12);
        doc.setTextColor(...(options.color || [0, 0, 0]));
        if (options.bold) doc.setFont(undefined, 'bold');
        doc.text(text, x, y);
        return doc.getTextWidth(text);
      };
      
      // Función para agregar línea
      const addLine = (x1, y1, x2, y2, color = secondaryColor) => {
        doc.setDrawColor(...color);
        doc.setLineWidth(0.5);
        doc.line(x1, y1, x2, y2);
      };
      
      // Header
      addText('ÓPTICAS KAIROZ', 20, yPosition, { fontSize: 20, bold: true, color: primaryColor });
      yPosition += 10;
      addText('REPORTE DE INVENTARIO', 20, yPosition, { fontSize: 16, bold: true });
      yPosition += 8;
      addText(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, 20, yPosition, { fontSize: 10, color: secondaryColor });
      yPosition += 15;
      
      // Línea separadora
      addLine(20, yPosition, 190, yPosition);
      yPosition += 10;
      
      // Resumen Ejecutivo
      addText('📊 RESUMEN EJECUTIVO', 20, yPosition, { fontSize: 14, bold: true });
      yPosition += 10;
      
      // Tarjetas de resumen
      const summaryData = [
        { label: 'Tipos de Armazones', value: inventoryData.totalProducts || 0, color: [249, 115, 22] },
        { label: 'Total de Armazones', value: inventoryData.totalUnits || 0, color: primaryColor },
        { label: 'Valor Total', value: `$${(inventoryData.totalValue || 0).toLocaleString()}`, color: successColor },
        { label: 'En Stock', value: `${Math.round(((inventoryData.products?.filter(p => p.stock > 0).length || 0) / (inventoryData.totalProducts || 1)) * 100)}%`, color: successColor }
      ];
      
      summaryData.forEach((item, index) => {
        const x = 20 + (index * 45);
        const y = yPosition;
        
        // Fondo de la tarjeta
        doc.setFillColor(...item.color);
        doc.roundedRect(x, y, 40, 25, 3, 3, 'F');
        
        // Texto del valor
        addText(item.value.toString(), x + 20, y + 12, { fontSize: 14, bold: true, color: [255, 255, 255] });
        
        // Texto de la etiqueta
        addText(item.label, x + 20, y + 20, { fontSize: 8, color: [255, 255, 255] });
      });
      
      yPosition += 35;
      
      // Análisis por Categorías
      addText('📈 ANÁLISIS POR CATEGORÍAS', 20, yPosition, { fontSize: 14, bold: true });
      yPosition += 10;
      
      // Top 5 marcas
      const brandCounts = {};
      (inventoryData.products || []).forEach(product => {
        const brand = product.brand || 'Sin marca';
        brandCounts[brand] = (brandCounts[brand] || 0) + 1;
      });
      
      const topBrands = Object.entries(brandCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
      
      addText('Top 5 Marcas:', 20, yPosition, { fontSize: 12, bold: true });
      yPosition += 8;
      
      topBrands.forEach(([brand, count], index) => {
        addText(`${index + 1}. ${brand}`, 25, yPosition, { fontSize: 10 });
        addText(`${count} productos`, 120, yPosition, { fontSize: 10, color: primaryColor });
        yPosition += 6;
      });
      
      yPosition += 10;
      
      // Distribución por estado
      const inStock = (inventoryData.products || []).filter(p => p.stock > 0).length;
      const outOfStock = (inventoryData.products || []).filter(p => p.stock === 0).length;
      
      addText('Distribución por Estado:', 20, yPosition, { fontSize: 12, bold: true });
      yPosition += 8;
      addText(`En Stock: ${inStock} productos`, 25, yPosition, { fontSize: 10, color: successColor });
      yPosition += 6;
      addText(`Agotados: ${outOfStock} productos`, 25, yPosition, { fontSize: 10, color: dangerColor });
      yPosition += 15;
      
      // Alertas de Inventario
      addText('⚠️ ALERTAS DE INVENTARIO', 20, yPosition, { fontSize: 14, bold: true });
      yPosition += 10;
      
      const outOfStockProducts = (inventoryData.products || []).filter(p => p.stock === 0);
      if (outOfStockProducts.length > 0) {
        addText('Productos Agotados:', 20, yPosition, { fontSize: 12, bold: true });
        yPosition += 8;
        
        outOfStockProducts.slice(0, 5).forEach((product, index) => {
          addText(`• ${product.sku} - ${product.brand}`, 25, yPosition, { fontSize: 10, color: dangerColor });
          yPosition += 5;
        });
        
        if (outOfStockProducts.length > 5) {
          addText(`... y ${outOfStockProducts.length - 5} productos más`, 25, yPosition, { fontSize: 8, color: secondaryColor });
          yPosition += 5;
        }
        yPosition += 10;
      }
      
      // Productos con mayor rotación
      const topRotatingProducts = (inventoryData.products || [])
        .filter(p => p.stock > 0)
        .sort((a, b) => b.stock - a.stock)
        .slice(0, 5);
      
      addText('Productos con Mayor Rotación:', 20, yPosition, { fontSize: 12, bold: true });
      yPosition += 8;
      
      topRotatingProducts.forEach((product, index) => {
        addText(`${product.sku} - ${product.brand}`, 25, yPosition, { fontSize: 10 });
        addText(`${product.stock} unidades`, 120, yPosition, { fontSize: 10, color: primaryColor });
        yPosition += 5;
      });
      
      yPosition += 15;
      
      // Detalle de Productos (solo primeros 10)
      addText('📋 DETALLE DE PRODUCTOS', 20, yPosition, { fontSize: 14, bold: true });
      yPosition += 10;
      
      // Encabezados de tabla
      const tableHeaders = ['SKU', 'Marca', 'Precio', 'Stock', 'Estado'];
      const columnWidths = [35, 40, 25, 20, 25];
      let xPosition = 20;
      
      tableHeaders.forEach((header, index) => {
        addText(header, xPosition, yPosition, { fontSize: 10, bold: true, color: primaryColor });
        xPosition += columnWidths[index];
      });
      
      yPosition += 8;
      addLine(20, yPosition, 190, yPosition);
      yPosition += 5;
      
      // Filas de productos
      (inventoryData.products || []).slice(0, 10).forEach((product, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        xPosition = 20;
        const rowData = [
          product.sku || 'N/A',
          product.brand || 'N/A',
          `$${(product.price || 0).toLocaleString()}`,
          (product.stock || 0).toString(),
          (product.stock || 0) > 0 ? 'En Stock' : 'Agotado'
        ];
        
        rowData.forEach((data, colIndex) => {
          addText(data, xPosition, yPosition, { fontSize: 9 });
          xPosition += columnWidths[colIndex];
        });
        
        yPosition += 6;
      });
      
      if ((inventoryData.products || []).length > 10) {
        yPosition += 5;
        addText(`... y ${(inventoryData.products || []).length - 10} productos más`, 20, yPosition, { fontSize: 8, color: secondaryColor });
      }
      
      // Footer
      const pageHeight = doc.internal.pageSize.height;
      addText(`Generado por: ${inventoryData.userProfile?.nombre || 'Sistema'}`, 20, pageHeight - 20, { fontSize: 8, color: secondaryColor });
      addText(`Ópticas Kairoz - Sistema de Inventario`, 20, pageHeight - 15, { fontSize: 8, color: secondaryColor });
      addText(`Fecha: ${new Date().toLocaleString('es-MX')}`, 20, pageHeight - 10, { fontSize: 8, color: secondaryColor });
      
      // Descargar el PDF
      const fileName = `Reporte_Inventario_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      return { success: true };
    } catch (error) {
      console.error('Error generando reporte:', error);
      return { success: false, error: error.message };
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateReport,
    isGenerating
  };
};


