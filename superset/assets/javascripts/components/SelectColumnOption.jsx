import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
  column: PropTypes.string.isRequired,
};

export default function SelectColumnOption({ column }) {
  return (
      <span className="m-r-5 option-label" title={column}>
        {column}
      </span>
  )
}
SelectColumnOption.propTypes = propTypes;
