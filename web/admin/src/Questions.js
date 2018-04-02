import React, {PureComponent} from 'react'
import Reorderable, {renderLeftDragHandle} from './components/Reorderable'
import {groupUpdater, Text} from './components/stateEditors'

import './Questions.css'

export default class Questions extends PureComponent {
  state = { selectedQuestionId: null }

  render() {
    return (
      <Reorderable className="questions"
        droppableId="questions"
        enabled={true}
        onMove={this.moveQuestion}
        renderDragHandle={renderLeftDragHandle}
        onItemFocus={this.onQuestionFocus}
        data={this.sortedQuestions()}
        renderItem={({item, index, dragHandle}) => {
          const updater = groupUpdater()
          return (
            <div className="question draggable">
              {dragHandle}
              <div className="question-details">
                <div className="question-number">{index + 1}</div>
                <div className="question-fields">
                  <Text className="question-text underbar" updater={updater} value={item.text} maxLength={250} />
                </div>
              </div>
            </div>
          )
        }}
        renderFooter={() => (
          <footer>
            <div></div>
            { this.state.selectedQuestionId
              ? <div>
                  <button className="tertiary">Delete Question</button>
                  <button className="secondary">Cancel Changes</button>
                  <button>Save Question</button>
                </div>
              : <div>
                  <button onClick={this.props.onAdd}>Add New Question</button>
                </div>
            }
          </footer>
        )}
      />
    )
  }

  onQuestionFocus = q => console.log(q) || this.setState({selectedQuestionId: q.id})

  moveQuestion = (sourceIndex, destinationIndex) => {
    const {questionsRef} = this.props
    const questions = this.sortedQuestions()
    const [question] = questions.splice(sourceIndex, 1)
    const newOrder = questions.splice(destinationIndex, 0, question)
    newOrder.forEach((q, order) => questionsRef.child(q.id).update({order}))
  }

  sortedQuestions = () => this.props.questions.sort((a,b) => a.order - b.order)
}
