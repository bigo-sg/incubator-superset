import React from 'react';
import PropTypes from 'prop-types';
import { Panel } from 'react-bootstrap';
import InfoTooltipWithTrigger from '../../components/InfoTooltipWithTrigger';

const propTypes = {
  label: PropTypes.string,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
  startExpanded: PropTypes.bool,
  hasErrors: PropTypes.bool,
  hidden: PropTypes.bool,
};

const defaultProps = {
  label: null,
  description: null,
  startExpanded: false,
  hasErrors: false,
  hidden: false
};

export default class ControlPanelSection extends React.Component {
  constructor(props) {
    super(props);
    this.state = { expanded: this.props.startExpanded };
  }
  toggleExpand() {
    this.setState({ expanded: !this.state.expanded });
  }
  renderHeader() {
    const { label, description, hasErrors } = this.props;
    return (
      label &&
        <div>
          <i
            className={`text-primary expander fa fa-caret-${this.state.expanded ? 'down' : 'right'}`}
            onClick={this.toggleExpand.bind(this)}
          />
          {' '}
          <span onClick={this.toggleExpand.bind(this)}>{label}</span>
          {' '}
          {description && <InfoTooltipWithTrigger label={label} tooltip={description} />}
          {hasErrors &&
            <InfoTooltipWithTrigger
              label="validation-errors"
              bsStyle="danger"
              tooltip="This section contains validation errors"
            />
          }
        </div>);
  }

  render() {
    const divStyle = this.props.hidden ? { display: 'none' } : null;

    return (
      <Panel
        className="control-panel-section"
        collapsible
        style={divStyle}
        expanded={this.state.expanded}
        header={this.renderHeader()}
      >
        {this.props.children}
      </Panel>
    );
  }
}

ControlPanelSection.propTypes = propTypes;
ControlPanelSection.defaultProps = defaultProps;
