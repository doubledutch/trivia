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
  }


  render() {
    const {session} = this.props
    const {publicSession} = this.state
    if (!session || !publicSession) return <div className="presentation-driver" />

    switch (publicSession.state) {
      case 'NOT_STARTED': return this.renderNextQuestion(session, 0)
      default: return <div className="presentation-driver" />
    }
  }

  renderNextQuestion(session, questionIndex) {
    const {questions} = this.props
    const question = questions[questionIndex]
    return <div className="presentation-driver">
      <Question question={question} number={questionIndex+1} secondsLeft={session.secondsPerQuestion} totalSeconds={session.secondsPerQuestion}>
        <button onClick={this.startNextQuestion}>Start Question</button>
      </Question>
    </div>
  }

  publicSessionRef = () => this.props.fbc.database.public.adminRef('sessions').child(this.props.session.id)
  startNextQuestion = () => {
    const {session, questions} = this.props
    const {publicSession} = this.state
    const index = publicSession.question ? publicSession.question.index + 1 : 0

    this.publicSessionRef().update({
      state: 'QUESTION_OPEN',
      question: {
        index,
        text: questions[index].text,
        seconds: session.secondsPerQuestion
      }
    })
  }
}