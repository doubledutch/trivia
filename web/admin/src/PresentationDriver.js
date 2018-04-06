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
import './PresentationDriver.css'

import Question from './Question'

export default class PresentationDriver extends PureComponent {
  state = {}

  componentWillReceiveProps(newProps) {
    if (this.props.session.id !== newProps.session.id) {
      this.unwireHandlers()
      this.wireHandlers(newProps)
    }
  }

  componentDidUpdate() {
    const {publicSession} = this.state
    if (!this.timer && publicSession && publicSession.state === 'QUESTION_OPEN') this.startTimer()
  }

  componentDidMount() {
    this.wireHandlers(this.props)
  }
  componentWillUnmount() {
    this.unwireHandlers()
  }

  wireHandlers() {
    this.publicSessionHandler = this.publicSessionRef().on('value', data => this.setState({publicSession: data.val()}))
  }

  unwireHandlers() {
    this.publicSessionRef().off('value', this.publicSessionHandler)
    if (this.timer) clearInterval(this.timer)
  }

  render() {
    const {session} = this.props
    const {publicSession} = this.state
    if (!session || !publicSession) return <div className="presentation-driver" />

    switch (publicSession.state) {
      case 'NOT_STARTED': return this.renderNextQuestion(session, 0, true)
      case 'QUESTION_OPEN': return this.renderNextQuestion(session, publicSession.question.index + 1, false)
      case 'QUESTION_CLOSED': return this.renderNextQuestion(session, publicSession.question.index + 1, true)

      default: return <div className="presentation-driver" />
    }
  }

  renderNextQuestion(session, questionIndex, canProgress) {
    const {questions} = this.props
    const question = questions[questionIndex]
    
    return <div className="presentation-driver">
      { question && <Question question={question} number={questionIndex+1} secondsLeft={session.secondsPerQuestion} totalSeconds={session.secondsPerQuestion}>
          <button onClick={this.startNextQuestion} disabled={!canProgress}>Start Question</button>
        </Question>
      }
      { canProgress && <div className="buttons">
          <button className="secondary" onClick={this.showLeaderboard}>Display Leaderboard</button>
          <button className="tertiary" onClick={this.endGame}>End Game</button>
        </div>
      }
    </div>
  }

  publicSessionRef = () => this.props.fbc.database.public.adminRef('sessions').child(this.props.session.id)
  startNextQuestion = () => {
    const {session, questions} = this.props
    const {publicSession} = this.state
    const index = publicSession.question ? publicSession.question.index + 1 : 0
    const question = questions[index]

    this.publicSessionRef().update({
      state: 'QUESTION_OPEN',
      question: {
        index,
        text: question.text,
        totalSeconds: session.secondsPerQuestion,
        options: question.options,
      }
    }).then(() => {
      if (this.timer) clearInterval(this.timer)
      this.startTimer()
    })
  }

  showLeaderboard = () => this.publicSessionRef().update({state: 'LEADERBOARD'})
  endGame = () => null // TODO?

  startTimer() {
    this.questionStartedAt = new Date().valueOf()
    this.timer = setInterval(() => {
      const timeLeft = this.state.publicSession.question.totalSeconds - (new Date().valueOf() - this.questionStartedAt)/1000
      if (timeLeft < 0) {
        clearInterval(this.timer)
        this.timer = null
        const {questions} = this.props
        const {publicSession} = this.state
        if (publicSession.state === 'QUESTION_OPEN') {
          const {question} = publicSession
          this.publicSessionRef().update({
            state: 'QUESTION_CLOSED',
            question: {
              index: question.index,
              text: question.text,
              options: question.options,
              correctIndex: questions[question.index].correctIndex,
              guesses: [0,0,0,0], // TODO
              totalGuesses: 1,    // TODO
            }
          })  
        }
      }
    }, 500)
  }
}