import React from 'react';
import PropTypes from 'prop-types';
import Tooltip from '@mui/material/Tooltip';

const MulitValueProgresBar = ({ values, total, thickness=10, borderRadius=5, backgroundColor }) => {
  return (
    <div
      className={`w-full ${backgroundColor ? "" : "bg-gray-300"} overflow-hidden flex`}
      style={{ height: thickness, borderRadius: borderRadius, backgroundColor: backgroundColor ? backgroundColor : "" }}
    >
      {values.map((segment, index) => (
        <Tooltip key={index} title={segment.tooltip} arrow>
          <div
            className="h-full"
            style={{
              width: `${(segment.value / total) * 100}%`,
              backgroundColor: segment.color,
            }}
          ></div>
        </Tooltip>
      ))}
    </div>
  );
};

MulitValueProgresBar.propTypes = {
  values: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.number.isRequired,
      color: PropTypes.string.isRequired,
      tooltip: PropTypes.string.isRequired,
    })
  ).isRequired,
  total: PropTypes.number.isRequired,
  thickness:  PropTypes.number,
};

MulitValueProgresBar.defaultProps = {
  thickness: 10,
};

export default MulitValueProgresBar;
