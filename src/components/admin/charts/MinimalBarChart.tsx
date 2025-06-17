import React from 'react';
import SVGBarChart from './SVGBarChart';

interface MinimalBarChartProps {
  data: Array<{ name: string; count: number }>;
  color: string;
}

const MinimalBarChart = (props: MinimalBarChartProps) => {
  return <SVGBarChart {...props} />;
};

export default MinimalBarChart;
