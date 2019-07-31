import React from 'react';
import PropTypes from 'prop-types';
import {Alert, Button} from 'react-bootstrap';

import QueryTable from './QueryTable';
import {t} from '../../locales';
import Select from 'react-select';
import {QUERY_STATUS_OPTIONS, SQL_TYPE_OPTIONS} from "../constants";

const propTypes = {
  height: PropTypes.number.isRequired,
  queries: PropTypes.array.isRequired,
  actions: PropTypes.object.isRequired,
};

class QueryHistory extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      sqlText: '',
      status: '',
      sqlType: '',
      queriesArray: [],
      queriesLoading: false
    };
  }

  componentDidMount() {
    this.setState({queriesArray: this.props.queries});
  }

  componentWillReceiveProps(newProps) {
    this.refreshQueries();
  }

  changeSql(event) {
    this.setState({sqlText: event.target.value});
  }

  changeStatus(status) {
    const val = (status) ? status.value : null;
    this.setState({status: val});
  }

  changeSqlType(sqlType) {
    const val = (sqlType) ? sqlType.value : null;
    this.setState({sqlType: val});
  }

  refreshQueries() {
    this.setState({queriesLoading: true});
    let data = [];
    const {sqlType, status, sqlText} = this.state;
    const sqlTypeNotEmpty = sqlType && sqlType !== '';
    const sqlTextNotEmpty = sqlText && sqlText !== '';
    const statusNotEmpty = status && status !== '';
    if (sqlTypeNotEmpty || sqlTextNotEmpty || statusNotEmpty) {
       this.props.queries.map(i => {
        let isFilterData = true;
        if (sqlTypeNotEmpty && i.sql_type !== sqlType) {
          isFilterData = false;
        } else if (sqlTextNotEmpty && i.sql !== sqlText) {
          isFilterData = false;
        } else if (statusNotEmpty && i.state !== status) {
          isFilterData = false;
        }
        if (isFilterData) {
          data.push(i);
        }
      });
    } else {
       data = [...this.props.queries];
    }
    this.setState({queriesArray: data, queriesLoading: false});
  }

  getControls() {
    return (
      <div className="row space-1">
        <div className="col-sm-8">
          <input
            type="text"
            onChange={this.changeSql.bind(this)}
            className="form-control input-sm"
            placeholder={t('Search Sql')}
          />
        </div>
        <div className="col-sm-4 search-date-filter-container">
          <Select
            name="select-sqlType"
            placeholder={t('[Query sqlType]')}
            options={SQL_TYPE_OPTIONS.map(s => ({value: s, label: s}))}
            value={this.state.sqlType}
            isLoading={false}
            autosize={false}
            onChange={this.changeSqlType.bind(this)}
          />
          <Select
            name="select-status"
            placeholder={t('[Query Status]')}
            options={QUERY_STATUS_OPTIONS.map(s => ({value: s, label: s}))}
            value={this.state.status}
            isLoading={false}
            autosize={false}
            onChange={this.changeStatus.bind(this)}
          />
          <Button bsSize="small" bsStyle="success" onClick={this.refreshQueries.bind(this)}>
            {t('Search')}
          </Button>
        </div>
      </div>
    );
  }

  render() {
    const height = this.props.height;
    return (
      <div style={{height}}>
        {this.state.queriesLoading ? (
          <img className="loading" alt="Loading..." src="/static/assets/images/loading.gif"/>
        ) : (
          <div>
            {this.getControls.bind(this)()}
            {this.state.queriesArray.length > 0 ? (
              <div className="query-history" style={{height: height - 40}}>
                 <QueryTable
                  columns={[
                    'state', 'started', 'duration', 'progress',
                    'rows', 'sql', 'sqltype', 'output', 'actions',
                  ]}
                  queries={this.state.queriesArray}
                  actions={this.props.actions}
                 />
              </div>
            ) : (
              <Alert bsStyle="info">
                {t('No query history yet...')}
              </Alert>
            )}
          </div>
        )}
      </div>
    )
  }
}

QueryHistory.propTypes = propTypes;

export default QueryHistory;
