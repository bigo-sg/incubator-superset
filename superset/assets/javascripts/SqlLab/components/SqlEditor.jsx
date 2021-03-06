import React from 'react';
import PropTypes from 'prop-types';
import throttle from 'lodash.throttle';
import {
  Col,
  FormGroup,
  InputGroup,
  Form,
  FormControl,
  Label,
  OverlayTrigger,
  Row,
  Tooltip,
  Collapse,
  ButtonGroup
} from 'react-bootstrap';
import SplitPane from 'react-split-pane';

import Button from '../../components/Button';
import TemplateParamsEditor from './TemplateParamsEditor';
import SouthPane from './SouthPane';
import SaveQuery from './SaveQuery';
import Timer from '../../components/Timer';
import SqlEditorLeftBar from './SqlEditorLeftBar';
import AceEditorWrapper from './AceEditorWrapper';
import {STATE_BSSTYLE_MAP} from '../constants';
import RunQueryActionButton from './RunQueryActionButton';
import {t} from '../../locales';


const propTypes = {
  actions: PropTypes.object.isRequired,
  getHeight: PropTypes.func.isRequired,
  database: PropTypes.object,
  latestQuery: PropTypes.object,
  tables: PropTypes.array.isRequired,
  editorQueries: PropTypes.array.isRequired,
  dataPreviewQueries: PropTypes.array.isRequired,
  queryEditor: PropTypes.object.isRequired,
  hideLeftBar: PropTypes.bool,
};

const defaultProps = {
  database: null,
  latestQuery: null,
  hideLeftBar: false,
};

class SqlEditor extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      autorun: props.queryEditor.autorun,
      ctas: '',
    };

    this.onResize = this.onResize.bind(this);
    this.throttledResize = throttle(this.onResize, 100);
  }

  componentWillMount() {
    if (this.state.autorun) {
      this.setState({autorun: false});
      this.props.actions.queryEditorSetAutorun(this.props.queryEditor, false);
      this.startQuery();
    }
  }

  componentDidMount() {
    this.onResize();
    window.addEventListener('resize', this.throttledResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.throttledResize);
  }

  onResize(size) {
    const height = this.sqlEditorHeight();
    let editorPaneHeight = this.props.queryEditor.height || 300;
    const splitPaneHandlerHeight = 15;
    if (size && !isNaN(Number(size))) {
      editorPaneHeight = size;
    }

    this.setState({
      editorPaneHeight,
      southPaneHeight: height - editorPaneHeight - splitPaneHandlerHeight,
      height,
    });

    if (size && !isNaN(Number(size))) {
      this.props.actions.persistEditorHeight(this.props.queryEditor, size);
    }
  }

  setQueryEditorSql(sql) {
    this.props.actions.queryEditorSetSql(this.props.queryEditor, sql);
  }

  setQueryEditorSqlType(sqlType) {
    this.props.actions.queryEditorSetSqlType(this.props.queryEditor, sqlType);
  }

  runQuery(runAsync = false) {
    if (!this.props.queryEditor.sql) {
      return;
    }
    let effectiveRunAsync = runAsync;
    if (!this.props.database.allow_run_sync) {
      effectiveRunAsync = true;
    }
    this.startQuery(effectiveRunAsync);
  }

  startQuery(runAsync = false, ctas = false) {
    const qe = this.props.queryEditor;
    const query = {
      dbId: qe.dbId,
      sql: qe.selectedText ? qe.selectedText : qe.sql,
      sqlEditorId: qe.id,
      tab: qe.title,
      schema: qe.schema,
      tempTableName: ctas ? this.state.ctas : '',
      templateParams: qe.templateParams,
      sql_type: qe.sql_type,
      runAsync,
      ctas,
    };
    this.props.actions.runQuery(query);
    this.props.actions.setActiveSouthPaneTab('Results');
  }

  stopQuery() {
    this.props.actions.postStopQuery(this.props.latestQuery);
  }

  createTableAs() {
    this.startQuery(true, true);
  }

  ctasChanged(event) {
    this.setState({ctas: event.target.value});
  }

  sqlEditorHeight() {
    const horizontalScrollbarHeight = 25;
    return parseInt(this.props.getHeight(), 10) - horizontalScrollbarHeight;
  }

  renderEditorSqlTypeBar() {
    const qe = this.props.queryEditor;
    const btnStyle = (type) => {
      return qe.sql_type === type ? 'primary' : 'default'
    };
    const sqlTypeMap = {
      presto: 'Presto',
      hive: 'Hive'
    };
    return (
      <div className="sql-type-bar">
        <span>{t('请选择SQL类型：')}</span>
        <ButtonGroup>
          {Object.entries(sqlTypeMap).map(([k, v]) => (
            <Button key={k} bsStyle={btnStyle(k)} onClick={this.setQueryEditorSqlType.bind(this, k)}>{v}</Button>
          ))}
        </ButtonGroup>
      </div>
    )
  }

  renderEditorBottomBar() {
    let ctasControls;
    if (this.props.database && this.props.database.allow_ctas) {
      const ctasToolTip = t('Create table as with query results');
      ctasControls = (
        <FormGroup>
          <InputGroup>
            <FormControl
              type="text"
              bsSize="small"
              className="input-sm"
              placeholder={t('new table name')}
              onChange={this.ctasChanged.bind(this)}
            />
            <InputGroup.Button>
              <Button
                bsSize="small"
                disabled={this.state.ctas.length === 0}
                onClick={this.createTableAs.bind(this)}
                tooltip={ctasToolTip}
              >
                <i className="fa fa-table"/> CTAS
              </Button>
            </InputGroup.Button>
          </InputGroup>
        </FormGroup>
      );
    }
    const qe = this.props.queryEditor;
    let limitWarning = null;
    if (this.props.latestQuery && this.props.latestQuery.limit_reached) {
      const tooltip = (
        <Tooltip id="tooltip">
          It appears that the number of rows in the query results displayed
          was limited on the server side to
          the {this.props.latestQuery.rows} limit.
        </Tooltip>
      );
      limitWarning = (
        <OverlayTrigger placement="left" overlay={tooltip}>
          <Label bsStyle="warning" className="m-r-5">LIMIT</Label>
        </OverlayTrigger>
      );
    }
    return (
      <div className="sql-toolbar clearfix" id="js-sql-toolbar">
        <div className="pull-left">
          <Form inline>
            <span className="m-r-5">
              <RunQueryActionButton
                allowAsync={this.props.database ? this.props.database.allow_run_async : false}
                dbId={qe.dbId}
                queryState={this.props.latestQuery && this.props.latestQuery.state}
                runQuery={this.runQuery.bind(this)}
                selectedText={qe.selectedText}
                stopQuery={this.stopQuery.bind(this)}
              />
            </span>
            <span className="m-r-5">
              <SaveQuery
                defaultLabel={qe.title}
                sql={qe.sql}
                className="m-r-5"
                onSave={this.props.actions.saveQuery}
                schema={qe.schema}
                dbId={qe.dbId}
              />
            </span>
            {ctasControls}
          </Form>
        </div>
        <div className="pull-right">
          <TemplateParamsEditor
            language="json"
            onChange={(params) => {
              this.props.actions.queryEditorSetTemplateParams(qe, params);
            }}
            code={qe.templateParams}
          />
          {limitWarning}
          {this.props.latestQuery &&
          <Timer
            startTime={this.props.latestQuery.startDttm}
            endTime={this.props.latestQuery.endDttm}
            state={STATE_BSSTYLE_MAP[this.props.latestQuery.state]}
            isRunning={this.props.latestQuery.state === 'running'}
          />
          }
        </div>
      </div>
    );
  }

  render() {
    const height = this.sqlEditorHeight();
    const defaultNorthHeight = this.props.queryEditor.height || 300;
    return (
      <div
        className="SqlEditor"
        style={{
          height: height + 'px',
        }}
      >
        <SplitPane split="vertical" defaultSize={400} maxSize={600} style={{padding: '0 10px'}}>
          <Collapse
            in={!this.props.hideLeftBar}
          >
            <SqlEditorLeftBar
              height={height}
              queryEditor={this.props.queryEditor}
              tables={this.props.tables}
              actions={this.props.actions}
            />
          </Collapse>
          <div style={{height: this.state.height, padding: '0 10px'}}>
            <SplitPane
              split="horizontal"
              defaultSize={defaultNorthHeight}
              minSize={100}
              onChange={this.onResize}
            >
              <div style={{width: '100%', height: this.state.editorPaneHeight || defaultNorthHeight}}>
                <div>
                  {this.renderEditorSqlTypeBar()}
                  <AceEditorWrapper
                    actions={this.props.actions}
                    onBlur={this.setQueryEditorSql.bind(this)}
                    queryEditor={this.props.queryEditor}
                    onAltEnter={this.runQuery.bind(this)}
                    sql={this.props.queryEditor.sql}
                    tables={this.props.tables}
                    height={((this.state.editorPaneHeight || defaultNorthHeight) - 100) + 'px'}
                  />
                  {this.renderEditorBottomBar()}
                </div>
              </div>
              <div ref="south">
                <SouthPane
                  editorQueries={this.props.editorQueries}
                  dataPreviewQueries={this.props.dataPreviewQueries}
                  actions={this.props.actions}
                  height={this.state.southPaneHeight || 0}
                />
              </div>
            </SplitPane>
          </div>
        </SplitPane>
      </div>
    );
  }
}

SqlEditor.defaultProps = defaultProps;
SqlEditor.propTypes = propTypes;

export default SqlEditor;
