import React, {PureComponent} from 'react'
import Reorderable, {renderLeftDragHandle} from './components/Reorderable'
import './Questions.css'

export default class Questions extends PureComponent {
  render() {
    return (
      <Reorderable className="questions"
        droppableId="questions"
        enabled={true}
        onMove={this.moveQuestion}
        renderDragHandle={renderLeftDragHandle}
        data={this.sortedQuestions()}
        renderItem={({item, dragHandle}) => (
          <div className="question draggable">{dragHandle} <div>{item.text}</div></div>
        )}
        renderFooter={() => (
          <footer>
            <button className="tertiary">Delete Question</button>
            <button className="secondary">Cancel Changes</button>
            <button>Save Question</button>
          </footer>
        )}
      />
    )
  }

  moveQuestion = (sourceIndex, destinationIndex) => {
    const {refForQuestion} = this.props
    const questions = this.sortedQuestions()
    const [question] = questions.splice(sourceIndex, 1)
    const newOrder = questions.splice(destinationIndex, 0, question)
    newOrder.forEach((q, order) => refForQuestion(q).update({order}))
  }

  sortedQuestions = () => this.props.questions.sort((a,b) => a.order - b.order)
}
