import React, { useMemo } from 'react';

interface SVGBarChartProps {
  data: Array<{ name: string; count: number }>;
  color: string;
}

const SVGBarChart = ({ data, color }: SVGBarChartProps) => {
  const maxValue = useMemo(() => Math.max(...data.map(d => d.count)), [data]);
  const chartHeight = 250;
  const barHeight = 25;
  const labelWidth = 80;
  const chartWidth = '100%';
  const spacing = 10;
  
  // Calculate total height needed
  const totalHeight = data.length * (barHeight + spacing);
  
  return (
    <div className="h-[250px] w-full overflow-y-auto">
      <svg
        width={chartWidth}
        height={totalHeight}
        className="w-full"
        style={{ minHeight: `${totalHeight}px` }}
      >
        {data.map((item, index) => {
          const y = index * (barHeight + spacing);
          const width = `${(item.count / maxValue) * 100}%`;
          
          return (
            <g key={item.name} transform={`translate(0, ${y})`}>
              {/* Label */}
              <text
                x="0"
                y={barHeight / 2}
                dy="0.35em"
                className="text-xs fill-gray-300"
                style={{ fontSize: '12px' }}
              >
                {item.name}
              </text>
              
              {/* Bar */}
              <g transform={`translate(${labelWidth}, 0)`}>
                {/* Background */}
                <rect
                  width="100%"
                  height={barHeight}
                  fill="rgba(37, 99, 235, 0.1)"
                  rx={4}
                />
                {/* Value bar */}
                <rect
                  width={width}
                  height={barHeight}
                  fill={color}
                  rx={4}
                >
                  <title>{item.count}</title>
                </rect>
                {/* Value label */}
                <text
                  x={10}
                  y={barHeight / 2}
                  dy="0.35em"
                  className="text-xs fill-gray-100"
                  style={{ fontSize: '12px' }}
                >
                  {item.count}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default SVGBarChart;
