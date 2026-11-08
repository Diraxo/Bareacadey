import React from 'react';
import { Chart } from 'primereact/chart';

const CircularPercentageChart = ({ width=200, backgroundColor="#36A2EB", fadeColor="#E0E0E0", percentage=0, text="", textClassName="" }) => {
  const chartData = {
    datasets: [
      {
        data: [percentage, 100 - percentage],
        backgroundColor: [backgroundColor, fadeColor],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    cutout: '80%', // Adjust this to control the thickness of the chart
    plugins: {
      tooltip: {
        enabled: false,
      },
    },
  };

  return (
    <div className="p-3" style={{ position: 'relative', width: width, height: width}}>
      <Chart type="doughnut" data={chartData} options={chartOptions} />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '20px',
          fontWeight: 'bold',
        }}
      >
        <p style={{textAlign: 'center', marginBottom: -5}} className={textClassName}>{`${text ? text : (percentage+"%")}`}</p>
      </div>
    </div>
  );
};

export default CircularPercentageChart;
