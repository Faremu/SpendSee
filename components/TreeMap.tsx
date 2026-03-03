
import React, { useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { Transaction, TransactionType } from '../types';
import { CATEGORIES } from '../constants';

interface TreeMapProps {
  transactions: Transaction[];
  width: number;
  height: number;
  onNodeClick?: (category: string, value: number, color: string, icon: string) => void;
}

const TreeMap: React.FC<TreeMapProps> = ({ transactions, width, height, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const getIconUrl = (icon: string) => {
    if (!icon) return '💸';
    const isPotentialUrl = icon.startsWith('http') || (icon.includes('.') && !icon.includes(' '));
    
    if (isPotentialUrl) {
      if (/\.(jpg|jpeg|png|gif|svg|webp)$/i.test(icon)) {
         return icon;
      }
      try {
        const domain = icon.replace('https://', '').replace('http://', '').split('/')[0];
        return `https://vexly.app/api/proxy/logo?domain=${domain}&size=128&retina=true&format=png`;
      } catch (e) {
        return icon;
      }
    }
    return icon;
  };

  const { data, totalValue } = useMemo(() => {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const categoryGroups = d3.group(expenses, d => d.category);
    
    let total = 0;
    const children = Array.from(categoryGroups).map(([name, group]) => {
      const sum = d3.sum(group, d => d.amount);
      total += sum;
      const firstTransaction = group[0];
      const icon = firstTransaction?.categoryIcon || '💸';
      const defaultColor = CATEGORIES.find(c => c.id === name.toLowerCase())?.color || 
                          `hsl(${Math.abs(name.split('').reduce((a,b)=>a+b.charCodeAt(0),0)) % 360}, 65%, 90%)`;
      
      return {
        name,
        icon,
        value: sum,
        color: firstTransaction?.color || defaultColor
      };
    });

    return {
      data: { name: "Expenses", children },
      totalValue: total
    };
  }, [transactions]);

  useEffect(() => {
    if (!svgRef.current || data.children.length === 0 || width <= 0 || height <= 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const defs = svg.append("defs");

    const root = d3.hierarchy(data)
      .sum(d => (d as any).value)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    d3.treemap<any>()
      .size([width, height])
      .paddingInner(4)
      .paddingOuter(2) // Add outer padding to prevent stroke clipping
      .round(true)
      (root);

    const nodes = svg.selectAll("g")
      .data(root.leaves())
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x0},${d.y0})`)
      .style("cursor", "pointer")
      .on("click", (event, d: any) => {
        if (onNodeClick) {
          onNodeClick(d.data.name, d.data.value, d.data.color, d.data.icon);
        }
      });

    nodes.each(function(d: any, i) {
      const gradId = `grad-${i}`;
      const flareId = `flare-${i}`;
      const clipId = `clip-${i}`;
      const boxW = Math.max(0, d.x1 - d.x0);
      const boxH = Math.max(0, d.y1 - d.y0);
      
      // Dynamic corner radius to prevent "oval" look on small rects
      const rx = Math.min(16, boxW / 4, boxH / 4);
      
      // Clip path for this specific node
      defs.append("clipPath")
        .attr("id", clipId)
        .append("rect")
        .attr("width", boxW)
        .attr("height", boxH)
        .attr("rx", rx);

      // Base Gradient
      const grad = defs.append("radialGradient")
        .attr("id", gradId)
        .attr("cx", "0%")
        .attr("cy", "0%")
        .attr("r", "120%")
        .attr("fx", "0%")
        .attr("fy", "0%");

      grad.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", d.data.color)
        .attr("stop-opacity", 1);

      grad.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", d3.color(d.data.color)?.darker(0.3).toString() || d.data.color)
        .attr("stop-opacity", 1);

      // Flare Gradient (White Glow)
      const flare = defs.append("radialGradient")
        .attr("id", flareId)
        .attr("cx", "15%")
        .attr("cy", "15%")
        .attr("r", "70%") // Increased from 60%
        .attr("fx", "15%")
        .attr("fy", "15%");

      flare.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#ffffff")
        .attr("stop-opacity", 0.6); // Increased from 0.4

      flare.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#ffffff")
        .attr("stop-opacity", 0);

      const g = d3.select(this);
      
      // Base Rect
      g.append("rect")
        .attr("width", boxW)
        .attr("height", boxH)
        .attr("fill", `url(#${gradId})`)
        .attr("rx", rx)
        .style("stroke", "#ffffff")
        .style("stroke-width", "1.5px");

      // Flare Overlay
      g.append("rect")
        .attr("width", boxW)
        .attr("height", boxH)
        .attr("fill", `url(#${flareId})`)
        .attr("rx", rx)
        .style("pointer-events", "none");

      // Apply clip path to the group for text
      g.attr("clip-path", `url(#${clipId})`);
    });

    nodes.each(function(d: any) {
      const node = d3.select(this);
      const iconUrl = getIconUrl(d.data.icon);
      const isUrl = iconUrl.startsWith('http');
      const boxW = d.x1 - d.x0;
      const boxH = d.y1 - d.y0;
      const percentage = totalValue > 0 ? ((d.data.value / totalValue) * 100).toFixed(1) : "0";

      // Show details if there's enough room
      const showDetails = boxW > 50 && boxH > 50;
      const showIconOnly = !showDetails && boxW > 20 && boxH > 20;

      if (showDetails) {
        // Adaptive padding based on box height
        const padding = boxH < 80 ? 6 : 10;
        const isDark = d3.hsl(d.data.color).l < 0.5;
        const textColor = isDark ? "#ffffff" : "#0f172a";
        
        // Hide icon if height is very tight
        const showIcon = boxH > 90;
        const showPercentage = boxH > 70;

        node.append("foreignObject")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", boxW)
          .attr("height", boxH)
          .append("xhtml:div")
          .style("width", "100%")
          .style("height", "100%")
          .style("padding", `${padding}px`)
          .style("display", "flex")
          .style("flex-direction", "column")
          .style("justify-content", "flex-start") // Align to top-left as requested
          .style("align-items", "flex-start")
          .style("color", textColor)
          .style("font-family", "Inter, sans-serif")
          .style("pointer-events", "none")
          .style("overflow", "hidden")
          .html(`
            <div style="display: flex; flex-direction: column; gap: 2px; width: 100%; max-height: 100%; overflow: hidden;">
              ${showIcon ? `
              <div style="width: 28px; height: 28px; border-radius: 6px; background: white; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 2px;">
                ${isUrl ? `<img src="${iconUrl}" style="width:100%;height:100%;object-fit:cover;" referrerpolicy="no-referrer" />` : `<span style="font-size: 18px;">${d.data.icon}</span>`}
              </div>` : ''}
              <div style="width: 100%;">
                <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; opacity: ${isDark ? 0.8 : 0.6}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2;">${d.data.name}</div>
                <div style="font-size: 13px; font-weight: 900; line-height: 1.1; margin-top: 1px;">฿${d.data.value.toLocaleString()}</div>
                ${showPercentage ? `<div style="font-size: 8px; font-weight: 800; opacity: 0.5; line-height: 1;">${percentage}%</div>` : ''}
              </div>
            </div>
          `);
      } else if (showIconOnly) {
        node.append("foreignObject")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", boxW)
          .attr("height", boxH)
          .append("xhtml:div")
          .style("width", "100%")
          .style("height", "100%")
          .style("display", "flex")
          .style("align-items", "center")
          .style("justify-content", "center")
          .html(`
            <div style="width: 20px; height: 20px; border-radius: 4px; background: white; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
              ${isUrl ? `<img src="${iconUrl}" style="width:100%;height:100%;object-fit:cover;" referrerpolicy="no-referrer" />` : `<span style="font-size: 14px;">${d.data.icon}</span>`}
            </div>
          `);
      }
    });

  }, [data, width, height, totalValue, onNodeClick]);

  if (data.children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-300 font-bold gap-2">
        <div className="text-4xl opacity-30">📊</div>
        <p className="uppercase tracking-widest text-[9px]">Awaiting Outflow</p>
      </div>
    );
  }

  return (
    <svg ref={svgRef} width={width} height={height} className="overflow-hidden" />
  );
};

export default TreeMap;
