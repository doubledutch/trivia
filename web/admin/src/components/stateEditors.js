import React, { Component, PureComponent } from 'react'

export class GroupUpdater extends PureComponent {
  state = {}

  editors = []

  componentDidUpdate() {
    this.onChange()
  }

  render() {
    return this.props.render(this)
  }

  addEditor(editor) {
    this.editors.push(editor)
  }

  removeEditor(editor) {
    const index = this.editors.indexOf(editor)
    if (index >= 0) this.editors.splice(index, 1)
  }

  build(obj) {
    return this.editors.reduce((o, editor) => {
      editor.props.saveTo(o, editor.state.pendingValue)
      return o
    }, obj || {})
  }

  cancel() {
    this.editors.forEach(editor => editor.setState({ pendingValue: editor.value }))
    this.setState({ hasPendingChanges: false })
  }

  onChange(editor, value) {
    this.setState({
      hasPendingChanges: this.editors.reduce(
        (hpc, ed) =>
          hpc || `${ed.value}` !== (editor === ed ? `${value}` : `${ed.state.pendingValue}`),
        false,
      ),
    })
  }
}

class SaveCancelEditor extends PureComponent {
  constructor(props) {
    super(props)
    this.value = props.value
    this.state = { pendingValue: props.value }
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

  onChange = e => {
    this.setState({ pendingValue: e.target.value })
    this.props.updater.onChange(this, e.target.value)
  }
}

export class Text extends SaveCancelEditor {
  render() {
    const { className, maxLength, placeholder } = this.props
    const { pendingValue } = this.state
    return (
      <div className={`input-container ${className}`}>
        <input
          type="text"
          maxLength={maxLength}
          onChange={this.onChange}
          value={pendingValue}
          placeholder={placeholder}
        />
        {maxLength && (
          <div className="input-chars-remaining">{maxLength - pendingValue.length}</div>
        )}
      </div>
    )
  }
}

export class Select extends SaveCancelEditor {
  render() {
    const { className, options, optionNameFn, optionValueFn } = this.props
    const { pendingValue } = this.state
    return (
      <select className={className} value={pendingValue} onChange={this.onChange}>
        {options.map(o => (
          <option value={optionValueFn(o)}>{optionNameFn(o)}</option>
        ))}
      </select>
    )
  }
}

export class RadioGroup extends SaveCancelEditor {
  render() {
    return this.props.render(this)
  }
}
export class Radio extends Component {
  render() {
    const { className, group, value } = this.props
    return (
      <input
        className={className}
        type="radio"
        value={value}
        checked={`${group.state.pendingValue}` === `${value}`}
        onChange={this.onChange}
      />
    )
  }

  onChange = e => {
    this.props.group.onChange(e)
  }
}
