import React, {PureComponent} from 'react'
import Reorderable, {renderLeftDragHandle} from './components/Reorderable'
import {groupUpdater, Text} from './components/stateEditors'

import './Questions.css'

export default class Questions extends PureComponent {
  state = { selectedQuestionId: null }
  updaters = {}

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
          this.updaters[item.id] = updater
          return (
            <div className="question draggable">
              {dragHandle}
              <div className="question-details">
                <div className="question-number">{index + 1}</div>
                <div className="question-fields">
                  <Text className="question-text underbar" updater={updater} value={item.text} maxLength={250} />
                  <div className="question-options">
                    <div className="question-option"><div>&nbsp;</div><div>Correct answer</div></div>
                    { [0,1,2,3].map(i => (
                      <div className="question-option" key={i}>
                        <Text className="underbar" updater={updater} value={""} maxLength={30} placeholder={`Answer ${letters[i]}`} />
                        <div><input type="radio" name={item.id} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        }}
        renderFooter={() => (
          <footer>
            <div></div>
            { this.hasPendingQuestionChanges()
              ? <div>
                  <button className="tertiary">Delete Question</button>
                  <button className="secondary" onClick={this.cancelChanges}>Cancel Changes</button>
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

  hasPendingQuestionChanges = () => this.state.selectedQuestionId // && any changes?

  onQuestionFocus = q => this.setState({selectedQuestionId: q ? q.id : null})

  moveQuestion = (sourceIndex, destinationIndex) => {
    const {questionsRef} = this.props
    const questions = this.sortedQuestions()
    const [question] = questions.splice(sourceIndex, 1)
    const newOrder = questions.splice(destinationIndex, 0, question)
    newOrder.forEach((q, order) => questionsRef.child(q.id).update({order}))
  }

  sortedQuestions = () => this.props.questions.sort((a,b) => a.order - b.order)

  cancelChanges = () => this.updaters[this.state.selectedQuestionId].cancel()
}

const letters = ['A','B','C','D']