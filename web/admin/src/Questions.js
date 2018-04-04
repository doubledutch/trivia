import React, {PureComponent} from 'react'
import Reorderable, {renderLeftDragHandle} from './components/Reorderable'
import {GroupUpdater, Text} from './components/stateEditors'

import './Questions.css'

export default class Questions extends PureComponent {
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
          // this.updaters[item.id] = updater
          return (
            <GroupUpdater additionalProps={item} render={updater => (
              <div className="question draggable">
                {dragHandle}
                <div className="question-details">
                  <div className="question-number">{index + 1}</div>
                  <div className="question-fields">
                    <Text className="question-text underbar" updater={updater} value={item.text} maxLength={250} saveTo={this.saveQuestionText} />
                    <div className="question-main">
                      <div className="question-options">
                        <div className="question-option"><div>&nbsp;</div><div>Correct answer</div></div>
                        { [0,1,2,3].map(i => (
                          <div className="question-option" key={i}>
                            <Text className="underbar" updater={updater} value={item.options[i]} maxLength={30} placeholder={`Answer ${letters[i]}`} saveTo={this.saveOption(i)} />
                            <div><input type="radio" name={item.id} value={i} /></div>
                          </div>
                        ))}
                      </div>
                      <div className="question-buttons">
                        { updater.state.hasPendingChanges && <button onClick={() => this.saveQuestion(item, updater)}>Save Question</button> }
                        { updater.state.hasPendingChanges && <button className="secondary" onClick={() => updater.cancel()}>Cancel Changes</button> }
                        <button className="tertiary" onClick={this.deleteQuestion(item)}>Delete Question</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )} />
          )
        }}
        renderFooter={() => (
          <footer>
            <div></div>
            <div>
              <button onClick={this.props.onAdd}>Add New Question</button>
            </div>
          </footer>
        )}
      />
    )
  }

  saveQuestion = (q, updater) => this.props.questionsRef.child(q.id).update(updater.build({options: []}))
  saveQuestionText = (obj, val) => obj.text = val
  saveOption = i => (obj, val) => obj.options[i] = val

  moveQuestion = (sourceIndex, destinationIndex) => {
    const {questionsRef} = this.props
    const questions = this.sortedQuestions()
    const [question] = questions.splice(sourceIndex, 1)
    const newOrder = questions.splice(destinationIndex, 0, question)
    newOrder.forEach((q, order) => questionsRef.child(q.id).update({order}))
  }

  sortedQuestions = () => this.props.questions.sort((a,b) => a.order - b.order)

  deleteQuestion = q => () => this.props.questionsRef.child(q.id).remove()
}

const letters = ['A','B','C','D']