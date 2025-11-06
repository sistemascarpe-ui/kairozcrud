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
      
      // Utilidad para cargar imagen como DataURL
      const loadImageAsDataUrl = async (url) => {
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          return null;
        }
      };

      // Precargar logo una vez
      const logoDataUrl = await loadImageAsDataUrl('/logo.png');

      // Función para dibujar encabezado de página con logo y fecha
      const renderHeader = () => {
        let headerTextX = 20;
        try {
          if (logoDataUrl) {
            const logoX = 20;
            const logoY = yPosition - 12;
            const logoSize = 12;
            doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoSize, logoSize);
            headerTextX = logoX + logoSize + 3;
          }
        } catch (e) {
          // Continuar sin interrumpir
        }

        // Títulos
        addText('ÓPTICAS KAIROZ', headerTextX, yPosition, { fontSize: 20, bold: true, color: primaryColor });
        addText('REPORTE DE INVENTARIO', headerTextX, yPosition + 8, { fontSize: 14, color: secondaryColor });

        // Fecha y hora
        const currentDate = new Date().toLocaleDateString('es-MX');
        const currentTime = new Date().toLocaleTimeString('es-MX');
        addText(`Fecha: ${currentDate}`, pageWidth - 60, yPosition, { fontSize: 10, color: secondaryColor });
        addText(`Hora: ${currentTime}`, pageWidth - 60, yPosition + 5, { fontSize: 10, color: secondaryColor });

        // Avanzar y dibujar línea separadora
        yPosition += 20;
        addLine(20, yPosition, pageWidth - 20, yPosition, primaryColor, 1);
        yPosition += 15;
      };
      
      // Función para agregar texto
      const addText = (text, x, y, options = {}) => {
        doc.setFontSize(options.fontSize || 12);
        doc.setTextColor(...(options.color || [0, 0, 0]));
        if (options.bold) doc.setFont(undefined, 'bold');
        doc.text(text, x, y);
      };
      
      // Ajustar texto al ancho máximo con "..."
      const fitText = (text, maxWidth, fontSize = 12, isBold = false) => {
        const originalFontSize = doc.getFontSize();
        doc.setFontSize(fontSize);
        if (isBold) doc.setFont(undefined, 'bold');
        let t = String(text || '');
        while (doc.getTextWidth(t) > maxWidth && t.length > 3) {
          t = t.slice(0, Math.max(0, t.length - 4)) + '...';
        }
        // Restaurar font
        doc.setFontSize(originalFontSize);
        doc.setFont(undefined, 'normal');
        return t;
      };
      
      // Función para agregar línea
      const addLine = (x1, y1, x2, y2, color = secondaryColor, width = 0.5) => {
        doc.setDrawColor(...color);
        doc.setLineWidth(width);
        doc.line(x1, y1, x2, y2);
      };
      
      // Renderizar encabezado en la primera página
      renderHeader();
      
      // Restaurar Resumen Ejecutivo (sin alertas ni distribución)
      addText('RESUMEN EJECUTIVO', 20, yPosition, { fontSize: 16, bold: true, color: primaryColor });
      yPosition += 15;

      const totalProducts = inventoryData.totalProducts || 0;
      const totalUnits = inventoryData.totalUnits || 0;
      const totalValue = typeof inventoryData.totalValue === 'number'
        ? inventoryData.totalValue
        : (inventoryData.products || []).reduce((sum, product) => sum + (parseFloat(product.price) || 0) * (parseInt(product.stock) || 0), 0);

      const inStockCount = typeof inventoryData.inStockCount === 'number'
        ? inventoryData.inStockCount
        : (inventoryData.products || []).filter(p => (parseInt(p.stock) || 0) > 0).length;
      // No redondear: truncar a 2 decimales (p.ej., 99.52)
      const stockPctRaw = totalProducts > 0 ? ((inStockCount / totalProducts) * 100) : 0;
      const stockPercentage = Math.trunc(stockPctRaw * 100) / 100;

      addText(`• Tipos de Armazones: ${totalProducts}`, 30, yPosition, { fontSize: 12 });
      yPosition += 8;
      addText(`• Total de Armazones: ${totalUnits}`, 30, yPosition, { fontSize: 12 });
      yPosition += 8;
      addText(`• Valor Total: $${totalValue.toLocaleString()}`, 30, yPosition, { fontSize: 12 });
      yPosition += 8;
      addText(`• En Stock: ${stockPercentage}%`, 30, yPosition, { fontSize: 12 });

      yPosition += 18;

      // Única sección adicional: lista de productos agotados por nombre
      addText('PRODUCTOS AGOTADOS', 20, yPosition, { fontSize: 16, bold: true, color: primaryColor });
      yPosition += 12;

      // Preferir la lista completa pasada desde index.jsx; fallback a products paginados
      const outOfStockProducts = Array.isArray(inventoryData.outOfStockList) 
        ? inventoryData.outOfStockList.map(p => ({ 
            // Nombre debe ser el SKU
            name: p?.sku || p?.name || 'Sin nombre', 
            sku: p?.sku || '',
            color: p?.color || '',
            brand: p?.brand || ''
          }))
        : (inventoryData.products || [])
            .filter(p => (parseInt(p.stock) || 0) === 0)
            .map(p => ({ 
              name: p?.sku || p?.name || 'Sin nombre', 
              sku: p?.sku || '',
              color: p?.color || '',
              brand: p?.brand || ''
            }));

      if (outOfStockProducts.length === 0) {
        addText('No hay productos agotados', 30, yPosition, { fontSize: 12, color: successColor });
        yPosition += 10;
      } else {
        // Tabla: Nombre | Color | Marca
        const startX = 30;
        // Ajuste de anchos para que la marca se vea mejor
        const nameWidth = 75; // Nombre (SKU)
        const gap = 5;
        const colorWidth = 25;
        const brandWidth = 60; // Más ancho para marcas largas
        const nameX = startX;
        const colorX = startX + nameWidth + gap;
        const brandX = colorX + colorWidth + gap;

        // Encabezados
        addText('Nombre', nameX, yPosition, { fontSize: 12, bold: true, color: primaryColor });
        addText('Color', colorX, yPosition, { fontSize: 12, bold: true, color: primaryColor });
        addText('Marca', brandX, yPosition, { fontSize: 12, bold: true, color: primaryColor });
        yPosition += 6;
        addLine(startX, yPosition, pageWidth - 20, yPosition, secondaryColor, 0.5);
        yPosition += 4;

        outOfStockProducts.forEach((product) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = 20;
          }
          const nombre = fitText(String(product?.name || 'Sin nombre'), nameWidth, 12);
          const color = fitText(String(product?.color || ''), colorWidth, 12);
          const marca = fitText(String(product?.brand || ''), brandWidth, 12);
          addText(nombre, nameX, yPosition, { fontSize: 12 });
          addText(color, colorX, yPosition, { fontSize: 12 });
          addText(marca, brandX, yPosition, { fontSize: 12 });
          yPosition += 7;
        });
      }
      
      // Nueva página para Conteo por Marca
      doc.addPage();
      yPosition = 20;
      renderHeader();
      // Conteo por marca
      const brandAggregates = Array.isArray(inventoryData.brandAggregates) ? inventoryData.brandAggregates : [];
      if (brandAggregates.length > 0) {
        // Título de sección
        addText('CONTEO POR MARCA', 20, yPosition + 6, { fontSize: 16, bold: true, color: primaryColor });
        yPosition += 12;

        // Tabla: Marca | Tipos | Total
        const startX = 30;
        const gap = 5;
        const brandWidth = 70;
        const typesWidth = 35;
        const totalWidth = 35;
        const brandX = startX;
        const typesX = brandX + brandWidth + gap;
        const totalX = typesX + typesWidth + gap;

        // Encabezados
        addText('Marca', brandX, yPosition, { fontSize: 12, bold: true, color: primaryColor });
        addText('Tipos', typesX, yPosition, { fontSize: 12, bold: true, color: primaryColor });
        addText('Total', totalX, yPosition, { fontSize: 12, bold: true, color: primaryColor });
        yPosition += 6;
        addLine(startX, yPosition, pageWidth - 20, yPosition, secondaryColor, 0.5);
        yPosition += 4;

        brandAggregates.forEach(row => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = 20;
            renderHeader();
          }
          const brandName = fitText(String(row?.brand || 'Sin marca'), brandWidth, 12);
          const typesStr = String(row?.types ?? 0);
          const totalStr = String(row?.totalUnits ?? 0);
          addText(brandName, brandX, yPosition, { fontSize: 12 });
          addText(typesStr, typesX, yPosition, { fontSize: 12 });
          addText(totalStr, totalX, yPosition, { fontSize: 12 });
          yPosition += 7;
        });
      }

      // Nueva página para Conteo por Grupo
      doc.addPage();
      yPosition = 20;
      renderHeader();
      // Tablas de agregados simples: Grupo, Descripción, Sub Marca
      const groupAggregates = Array.isArray(inventoryData.groupAggregates) ? inventoryData.groupAggregates : [];
      const descriptionAggregates = Array.isArray(inventoryData.descriptionAggregates) ? inventoryData.descriptionAggregates : [];
      const subBrandAggregates = Array.isArray(inventoryData.subBrandAggregates) ? inventoryData.subBrandAggregates : [];

      // Render: Grupo con Tipos y Total
      if (groupAggregates.length > 0) {
        addText('CONTEO POR GRUPO', 20, yPosition + 6, { fontSize: 16, bold: true, color: primaryColor });
        yPosition += 12;
        const startX = 30;
        const gap = 5;
        const groupWidth = 70;
        const typesWidth = 35;
        const totalWidth = 35;
        const groupX = startX;
        const typesX = groupX + groupWidth + gap;
        const totalX = typesX + typesWidth + gap;
        addText('Grupo', groupX, yPosition, { fontSize: 12, bold: true, color: primaryColor });
        addText('Tipos', typesX, yPosition, { fontSize: 12, bold: true, color: primaryColor });
        addText('Total', totalX, yPosition, { fontSize: 12, bold: true, color: primaryColor });
        yPosition += 6;
        addLine(startX, yPosition, pageWidth - 20, yPosition, secondaryColor, 0.5);
        yPosition += 4;
        groupAggregates.forEach(row => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = 20;
            renderHeader();
          }
          const groupName = fitText(String(row?.group || 'Sin grupo'), groupWidth, 12);
          const typesStr = String(row?.types ?? 0);
          const totalStr = String(row?.totalUnits ?? 0);
          addText(groupName, groupX, yPosition, { fontSize: 12 });
          addText(typesStr, typesX, yPosition, { fontSize: 12 });
          addText(totalStr, totalX, yPosition, { fontSize: 12 });
          yPosition += 7;
        });
      }

      // Nueva página para Conteo por Descripción
      doc.addPage();
      yPosition = 20;
      renderHeader();
      // Render: Descripción con Tipos y Total
      if (descriptionAggregates.length > 0) {
        addText('CONTEO POR DESCRIPCIÓN', 20, yPosition + 6, { fontSize: 16, bold: true, color: primaryColor });
        yPosition += 12;
        const startX = 30;
        const gap = 5;
        const descWidth = 70;
        const typesWidth = 35;
        const totalWidth = 35;
        const descX = startX;
        const typesX = descX + descWidth + gap;
        const totalX = typesX + typesWidth + gap;
        addText('Descripción', descX, yPosition, { fontSize: 12, bold: true, color: primaryColor });
        addText('Tipos', typesX, yPosition, { fontSize: 12, bold: true, color: primaryColor });
        addText('Total', totalX, yPosition, { fontSize: 12, bold: true, color: primaryColor });
        yPosition += 6;
        addLine(startX, yPosition, pageWidth - 20, yPosition, secondaryColor, 0.5);
        yPosition += 4;
        descriptionAggregates.forEach(row => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = 20;
            renderHeader();
          }
          const descName = fitText(String(row?.description || 'Sin descripción'), descWidth, 12);
          const typesStr = String(row?.types ?? 0);
          const totalStr = String(row?.totalUnits ?? 0);
          addText(descName, descX, yPosition, { fontSize: 12 });
          addText(typesStr, typesX, yPosition, { fontSize: 12 });
          addText(totalStr, totalX, yPosition, { fontSize: 12 });
          yPosition += 7;
        });
      }

      // Nueva página para Conteo por Sub Marca
      doc.addPage();
      yPosition = 20;
      renderHeader();
      // Render: Sub Marca con Tipos y Total
      if (subBrandAggregates.length > 0) {
        addText('CONTEO POR SUB MARCA', 20, yPosition + 6, { fontSize: 16, bold: true, color: primaryColor });
        yPosition += 12;
        const startX = 30;
        const gap = 5;
        const subBrandWidth = 70;
        const typesWidth = 35;
        const totalWidth = 35;
        const subBrandX = startX;
        const typesX = subBrandX + subBrandWidth + gap;
        const totalX = typesX + typesWidth + gap;
        addText('Sub Marca', subBrandX, yPosition, { fontSize: 12, bold: true, color: primaryColor });
        addText('Tipos', typesX, yPosition, { fontSize: 12, bold: true, color: primaryColor });
        addText('Total', totalX, yPosition, { fontSize: 12, bold: true, color: primaryColor });
        yPosition += 6;
        addLine(startX, yPosition, pageWidth - 20, yPosition, secondaryColor, 0.5);
        yPosition += 4;
        subBrandAggregates.forEach(row => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = 20;
            renderHeader();
          }
          const subBrandName = fitText(String(row?.subBrand || 'Sin sub marca'), subBrandWidth, 12);
          const typesStr = String(row?.types ?? 0);
          const totalStr = String(row?.totalUnits ?? 0);
          addText(subBrandName, subBrandX, yPosition, { fontSize: 12 });
          addText(typesStr, typesX, yPosition, { fontSize: 12 });
          addText(totalStr, totalX, yPosition, { fontSize: 12 });
          yPosition += 7;
        });
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