import { useState } from 'react';
import jsPDF from 'jspdf';

export const useImprovedPDFReport = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async (inventoryData) => {
    setIsGenerating(true);
    
    try {
      // Crear nuevo documento PDF en orientación vertical
      const doc = new jsPDF('portrait', 'mm', 'a4');
      
      // Configuración de colores
      const primaryColor = [30, 64, 175]; // Azul
      const secondaryColor = [75, 85, 99]; // Gris
      const successColor = [16, 185, 129]; // Verde
      const dangerColor = [239, 68, 68]; // Rojo
      const orangeColor = [245, 158, 11]; // Naranja
      
      let yPosition = 20;
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const contentWidth = pageWidth - 40;
      
      // Función para agregar texto
      const addText = (text, x, y, options = {}) => {
        doc.setFontSize(options.fontSize || 12);
        doc.setTextColor(...(options.color || [0, 0, 0]));
        if (options.bold) doc.setFont(undefined, 'bold');
        doc.text(text, x, y);
      };
      
      // Función para agregar línea
      const addLine = (x1, y1, x2, y2, color = secondaryColor, width = 0.5) => {
        doc.setDrawColor(...color);
        doc.setLineWidth(width);
        doc.line(x1, y1, x2, y2);
      };
      
      // Header simplificado
      addText('ÓPTICAS KAIROZ', 20, yPosition, { fontSize: 20, bold: true, color: primaryColor });
      addText('REPORTE DE INVENTARIO', 20, yPosition + 8, { fontSize: 14, color: secondaryColor });
      
      // Fecha en la esquina derecha
      const currentDate = new Date().toLocaleDateString('es-MX');
      const currentTime = new Date().toLocaleTimeString('es-MX');
      addText(`Fecha: ${currentDate}`, pageWidth - 60, yPosition, { fontSize: 10, color: secondaryColor });
      addText(`Hora: ${currentTime}`, pageWidth - 60, yPosition + 5, { fontSize: 10, color: secondaryColor });
      
      yPosition += 20;
      
      // Línea separadora
      addLine(20, yPosition, pageWidth - 20, yPosition, primaryColor, 1);
      yPosition += 15;
      
      // Resumen Ejecutivo - Diseño simple sin tarjetas
      addText('RESUMEN EJECUTIVO', 20, yPosition, { fontSize: 16, bold: true, color: primaryColor });
      yPosition += 15;
      
      // Calcular métricas
      const totalProducts = inventoryData.totalProducts || 0;
      const totalUnits = inventoryData.totalUnits || 0;
      const totalValue = (inventoryData.products || []).reduce((sum, product) => {
        return sum + (parseFloat(product.price) || 0) * (parseInt(product.stock) || 0);
      }, 0);
      const inStockCount = (inventoryData.products || []).filter(p => (parseInt(p.stock) || 0) > 0).length;
      const stockPercentage = totalProducts > 0 ? Math.round((inStockCount / totalProducts) * 100) : 0;
      
      // Métricas en formato de lista simple
      addText(`• Tipos de Armazones: ${totalProducts}`, 30, yPosition, { fontSize: 12 });
      yPosition += 8;
      addText(`• Total de Armazones: ${totalUnits}`, 30, yPosition, { fontSize: 12 });
      yPosition += 8;
      addText(`• Valor Total: $${totalValue.toLocaleString()}`, 30, yPosition, { fontSize: 12 });
      yPosition += 8;
      addText(`• En Stock: ${stockPercentage}%`, 30, yPosition, { fontSize: 12 });
      yPosition += 8;
      addText(`• Productos Agotados: ${totalProducts - inStockCount}`, 30, yPosition, { fontSize: 12 });
      
      yPosition += 20;
      
      // Análisis por Categorías
      addText('ANÁLISIS POR CATEGORÍAS', 20, yPosition, { fontSize: 16, bold: true, color: primaryColor });
      yPosition += 15;
      
      // Top 5 marcas
      const brandCounts = {};
      (inventoryData.products || []).forEach(product => {
        const brand = String(product.brand || 'Sin marca');
        brandCounts[brand] = (brandCounts[brand] || 0) + 1;
      });
      
      const topBrands = Object.entries(brandCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
      
      addText('TOP 5 MARCAS:', 30, yPosition, { fontSize: 14, bold: true, color: primaryColor });
      yPosition += 10;
      
      topBrands.forEach(([brand, count], index) => {
        addText(`${index + 1}. ${brand} - ${count} productos`, 30, yPosition, { fontSize: 11 });
        yPosition += 7;
      });
      
      yPosition += 15;
      
      // Distribución por estado
      const outOfStockCount = (inventoryData.products || []).filter(p => (parseInt(p.stock) || 0) === 0).length;
      
      addText('DISTRIBUCIÓN POR ESTADO:', 30, yPosition, { fontSize: 14, bold: true, color: primaryColor });
      yPosition += 10;
      
      addText(`• En Stock: ${inStockCount} productos`, 30, yPosition, { fontSize: 11, color: successColor });
      yPosition += 7;
      addText(`• Agotados: ${outOfStockCount} productos`, 30, yPosition, { fontSize: 11, color: dangerColor });
      
      yPosition += 20;
      
      // Alertas de Inventario
      addText('ALERTAS DE INVENTARIO', 20, yPosition, { fontSize: 16, bold: true, color: primaryColor });
      yPosition += 15;
      
      // Productos con mayor rotación
      const topRotatingProducts = (inventoryData.products || [])
        .filter(p => (parseInt(p.stock) || 0) > 0)
        .sort((a, b) => (parseInt(b.stock) || 0) - (parseInt(a.stock) || 0))
        .slice(0, 5);
      
      addText('PRODUCTOS CON MAYOR ROTACIÓN:', 30, yPosition, { fontSize: 14, bold: true, color: primaryColor });
      yPosition += 10;
      
      topRotatingProducts.forEach((product, index) => {
        addText(`${index + 1}. ${product.sku} (${product.brand}) - ${product.stock} unidades`, 30, yPosition, { fontSize: 11 });
        yPosition += 7;
      });
      
      yPosition += 15;
      
      // Productos agotados
      const outOfStockProducts = (inventoryData.products || []).filter(p => (parseInt(p.stock) || 0) === 0);
      
      if (outOfStockProducts.length > 0) {
        addText('PRODUCTOS AGOTADOS:', 30, yPosition, { fontSize: 14, bold: true, color: dangerColor });
        yPosition += 10;
        
        outOfStockProducts.slice(0, 5).forEach((product, index) => {
          addText(`${index + 1}. ${product.sku} (${product.brand})`, 30, yPosition, { fontSize: 11, color: dangerColor });
          yPosition += 7;
        });
        
        if (outOfStockProducts.length > 5) {
          addText(`... y ${outOfStockProducts.length - 5} productos más`, 30, yPosition, { fontSize: 10, color: secondaryColor });
          yPosition += 7;
        }
      } else {
        addText('¡EXCELENTE! No hay productos agotados', 30, yPosition, { fontSize: 12, color: successColor, bold: true });
        yPosition += 10;
      }
      
      yPosition += 20;
      
      // Detalle de Productos
      addText('DETALLE DE PRODUCTOS', 20, yPosition, { fontSize: 16, bold: true, color: primaryColor });
      yPosition += 15;
      
      // Verificar si necesitamos una nueva página
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Encabezados de tabla
      const tableHeaders = ['SKU', 'Marca', 'Precio', 'Stock', 'Estado'];
      const columnWidths = [40, 50, 35, 25, 30];
      let xPosition = 20;
      
      // Encabezados
      tableHeaders.forEach((header, index) => {
        addText(header, xPosition, yPosition, { fontSize: 10, bold: true, color: primaryColor });
        xPosition += columnWidths[index];
      });
      
      yPosition += 8;
      
      // Línea separadora de tabla
      addLine(20, yPosition, pageWidth - 20, yPosition, secondaryColor, 0.5);
      yPosition += 5;
      
      // Filas de productos
      const productsToShow = (inventoryData.products || []).slice(0, 15);
      
      productsToShow.forEach((product, index) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }
        
        xPosition = 20;
        const rowData = [
          String(product.sku || 'N/A'),
          String(product.brand || 'N/A'),
          `$${(parseFloat(product.price) || 0).toLocaleString()}`,
          (parseInt(product.stock) || 0).toString(),
          (parseInt(product.stock) || 0) > 0 ? 'En Stock' : 'Agotado'
        ];
        
        rowData.forEach((data, colIndex) => {
          const color = colIndex === 4 ? ((parseInt(product.stock) || 0) > 0 ? successColor : dangerColor) : [0, 0, 0];
          addText(data, xPosition, yPosition, { fontSize: 9, color: color });
          xPosition += columnWidths[colIndex];
        });
        
        yPosition += 6;
      });
      
      if ((inventoryData.products || []).length > 15) {
        yPosition += 5;
        addText(`... y ${(inventoryData.products || []).length - 15} productos más`, 20, yPosition, { fontSize: 9, color: secondaryColor });
      }
      
      // Footer simple
      yPosition = pageHeight - 20;
      addLine(20, yPosition, pageWidth - 20, yPosition, primaryColor, 0.5);
      yPosition += 5;
      
      addText(`Generado por: ${inventoryData.userProfile?.nombre || 'Sistema'}`, 20, yPosition, { fontSize: 8, color: secondaryColor });
      addText(`Ópticas Kairoz - Sistema de Inventario`, pageWidth - 80, yPosition, { fontSize: 8, color: secondaryColor });
      
      // Descargar el PDF
      const fileName = `Reporte_Inventario_Kairoz_${new Date().toISOString().split('T')[0]}.pdf`;
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