import React, {PureComponent} from 'react'

// function updater(editorComponent, onSave) {
//   return {
//     save() {
//       onSave(editorComponent.state.pendingValue)
//     },
//     cancel() {
//       editorComponent.setState({pendingValue: editorComponent.value})
//     }
//   }
// }

export function groupUpdater() {
  editors = []

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
      editors.forEach(editor => editor.setState({pendingValue: editorComponent.value}))
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
}

export class Select extends SaveCancelEditor {
  render() {
    const {className, options, optionNameFn, optionValueFn, value} = this.props
    const {pendingValue} = this.state
    return (
      <select className={className} value={pendingValue} onChange={this.onChange}>
        { options.map(o => <option value={optionValueFn(o)}>{optionNameFn(o)}</option>) }
      </select>
    )
  }

  onChange = e => this.setState({pendingValue: e.target.value})
}