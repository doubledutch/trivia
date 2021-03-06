/*
 * Copyright 2018 DoubleDutch, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { PureComponent } from 'react'
import { translate as t } from '@doubledutch/admin-client'
import Reorderable, { renderLeftDragHandle } from './components/Reorderable'
import { GroupUpdater, Radio, RadioGroup, Text } from './components/stateEditors'
import './Questions.css'

export default class Questions extends PureComponent {
  render() {
    const isActive = this.props.publicSessions[this.props.sessionId]
      ? this.props.publicSessions[this.props.sessionId].state !== 'NOT_STARTED'
      : false
    return (
      <Reorderable
        className="questions"
        droppableId="questions"
        enabled={!isActive}
        onMove={this.moveQuestion}
        renderDragHandle={renderLeftDragHandle}
        onItemFocus={this.onQuestionFocus}
        data={this.sortedQuestions()}
        renderItem={({ item, index, dragHandle }) => (
          <GroupUpdater
            additionalProps={item}
            render={updater => (
              <div className="question draggable">
                {dragHandle}
                <div className="question-details">
                  <div className="question-number">{index + 1}</div>
                  <div className="question-fields">
                    <Text
                      className="question-text underbar"
                      placeholder="Question Text"
                      updater={updater}
                      value={item.text}
                      maxLength={250}
                      saveTo={this.saveQuestionText}
                    />
                    <div className="question-main">
                      <RadioGroup
                        updater={updater}
                        value={item.correctIndex}
                        saveTo={this.saveCorrectIndex}
                        render={radioGroup => (
                          <div className="question-options">
                            <div className="question-option">
                              <div>&nbsp;</div>
                              <div>{t('correct')}</div>
                            </div>
                            {[0, 1, 2, 3].map(i => (
                              <div className="question-option" key={i}>
                                <Text
                                  className="underbar"
                                  updater={updater}
                                  value={item.options[i]}
                                  maxLength={30}
                                  placeholder="Add an answer"
                                  saveTo={this.saveOption(i)}
                                />
                                <div>
                                  <Radio group={radioGroup} value={i} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      />
                      <div className="question-buttons">
                        {updater.state.hasPendingChanges && (
                          <button onClick={() => this.saveQuestion(item, updater)}>
                            {t('saveQ')}
                          </button>
                        )}
                        {updater.state.hasPendingChanges && (
                          <button className="secondary" onClick={() => updater.cancel()}>
                            {t('cancelChanges')}
                          </button>
                        )}
                        <button
                          className="tertiary"
                          disabled={this.props.currentIndex >= index && isActive}
                          onClick={this.deleteQuestion(item)}
                        >
                          {t('deleteQ')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          />
        )}
        renderFooter={this.props.renderFooter}
      />
    )
  }

  saveQuestion = (q, updater) => {
    const question = updater.build({ options: [] })
    const index = question.correctIndex
    const currentAnswer = question.options[index]
    if (currentAnswer) {
      this.props.questionsRef.child(q.id).update(updater.build({ options: [] }))
    }
  }

  saveQuestionText = (obj, val) => (obj.text = val.trim())

  saveOption = i => (obj, val) => (obj.options[i] = val.trim())

  saveCorrectIndex = (obj, val) => (obj.correctIndex = +val)

  moveQuestion = (sourceIndex, destinationIndex) => {
    const { questionsRef } = this.props
    const questions = this.sortedQuestions()
    const [question] = questions.splice(sourceIndex, 1)
    questions.splice(destinationIndex, 0, question)
    const minIndex = Math.min(sourceIndex, destinationIndex)
    const maxIndex = Math.max(sourceIndex, destinationIndex) + 1
    for (let order = minIndex; order < maxIndex; ++order) {
      questionsRef.child(questions[order].id).update({ order })
    }
  }

  sortedQuestions = () => this.props.questions.sort((a, b) => a.order - b.order)

  deleteQuestion = q => () => {
    if (window.confirm(t('confirmDeleteQ'))) {
      this.props.questionsRef.child(q.id).remove()
    }
  }
}
