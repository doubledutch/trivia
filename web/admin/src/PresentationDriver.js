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
  publicSessionRef = () => this.props.fbc.database.public.adminRef('sessions').child(this.props.session.id)
  publicUsersRef = () => this.props.fbc.database.public.usersRef()

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
    if (!session || !publicSession) return <div className="presentation-driver"><button onClick={this.initializeSession}>Initialize</button></div>

    switch (publicSession.state) {
      case 'NOT_STARTED': return this.renderNextQuestion(session, 0, false)
      case 'QUESTION_OPEN': return this.renderNextQuestion(session, publicSession.question.index + 1, true)
      case 'QUESTION_CLOSED': return this.renderNextQuestion(session, publicSession.question.index + 1, false)

      default: return <div className="presentation-driver">{this.renderReset()}</div>
    }
  }

  renderNextQuestion(session, questionIndex, isQuestionInProgress) {
    const {questions} = this.props
    const question = questions[questionIndex]
    
    return <div className="presentation-driver">
      { question && <Question question={question} number={questionIndex+1} totalSeconds={session.secondsPerQuestion}>
          <button onClick={this.startNextQuestion} disabled={isQuestionInProgress}>Start Question</button>
        </Question>
      }
      { isQuestionInProgress
        ? <div className="buttons">
            <button className="tertiary" onClick={this.endQuestion}>End Current Question Early</button>
          </div>
        : questionIndex > 0 && <div className="buttons">
            <button className="secondary" onClick={this.showLeaderboard}>Display Leaderboard</button>
            <button className="tertiary" onClick={this.endGame}>End Game</button>
          </div>
      }
      { this.renderReset() }
    </div>
  }

  renderReset = () => <button className="tertiary" onClick={this.resetSession}>Reset trivia session</button>

  resetSession = () => {
    if (window.confirm('Are you sure you want to destroy the current trivia session? This cannot be undone.')) {
      if (this.timer) clearInterval(this.timer)
      
      // Remove the trivia session
      this.publicSessionRef().remove()

      // Remove users who were in the removed trivia session.
      this.publicUsersRef().once('value', data => {
        const users = data.val() || {}
        Object.keys(users)
          .filter(id => users[id].sessionId === this.props.session.id)
          .forEach(id => this.publicUsersRef().child(id).remove())
      })
    }
  }

  initializeSession = () => this.publicSessionRef().set({state: 'NOT_STARTED'})

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

  endQuestion = () => {
    if (this.timer) clearInterval(this.timer)

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

  startTimer() {
    this.questionStartedAt = new Date().valueOf()
    this.timer = setInterval(() => {
      const timeLeft = this.state.publicSession.question.totalSeconds - (new Date().valueOf() - this.questionStartedAt)/1000
      if (timeLeft < 0) {
        clearInterval(this.timer)
        this.timer = null
        this.endQuestion()
      }
    }, 500)
  }
}