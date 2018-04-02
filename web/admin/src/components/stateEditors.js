import React, {PureComponent} from 'react'

export function groupUpdater() {
  const editors = []

  return {
    addEditor(editor) {
      editors.push(editor)
    },
    removeEditor(editor) {
      const index = editors.indexOf(editor)
      if (index >= 0) editors.splice(index, 1)
    },
    build() {
      return editors.reduce((obj, editor) => editor.props.saveTo(obj, editor.state.pendingValue), {})
    },
    cancel() {
      editors.forEach(editor => editor.setState({pendingValue: editor.value}))
    },
    hasPendingChanges() {
      return editors.reduce((hpc, editor) => hpc || editor.value !== editor.state.pendingValue, false)
    }
  }
}

class SaveCancelEditor extends PureComponent {
  constructor(props) {
    super(props)
    this.value = props.value
    this.state = {pendingValue: props.value}
    props.updater.addEditor(this)
  }

  componentWillReceiveProps(newProps) {
    this.value = newProps.value
    if (newProps.updater !== this.props.updater) {
      this.props.updater.removeEditor(this)
      newProps.updater.addEditor(this)
    }
  }

  componentWillUnmount() {
    this.props.updater.removeEditor(this)
  }

  onChange = e => this.setState({pendingValue: e.target.value})
}

export class Text extends SaveCancelEditor {
  render() {
    const {className, maxLength} = this.props
    const {pendingValue} = this.state
    return (
      <div className="input-container">
        <input type="text" maxLength={maxLength} className={className} onChange={this.onChange} value={pendingValue} />
        { maxLength && <div className="input-chars-remaining">{maxLength - pendingValue.length}</div> }
      </div>
    )
  }
}

export class Select extends SaveCancelEditor {
  render() {
    const {className, options, optionNameFn, optionValueFn} = this.props
    const {pendingValue} = this.state
    return (
      <select className={className} value={pendingValue} onChange={this.onChange}>
        { options.map(o => <option value={optionValueFn(o)}>{optionNameFn(o)}</option>) }
      </select>
    )
  }
}
