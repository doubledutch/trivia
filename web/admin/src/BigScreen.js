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

import React, {PureComponent} from 'react'
import './BigScreen.css'

import Question from './Question'

export default class BigScreen extends PureComponent {
  state = {joined: []}
  componentDidMount() {
    const {sessionId} = this.props
    this.sessionRef().on('value', data => this.setState({session: data.val()}))
    this.usersRef().on('child_added', data => {
      const user = data.val()
      if (user.sessionId === sessionId) {
        this.setState(state => ({joined: [...state.joined, {...user, id: data.key}]}))
      }
    })
  }

  render() {
    const {session} = this.state
    if (session === undefined) return <div>Loading...</div>
    if (!session) return this.renderNotStarted()
    return (
      <div className="big-screen">
        {this.renderState(session)}
      </div>
    )
  }

  renderState(session) {
    switch (session.state) {
      case 'NOT_STARTED': return this.renderNotStarted()
      case 'QUESTION_OPEN': return this.renderOpenQuestion(session)
      default: return null
    }
  }

  renderNotStarted() {
    const {joined} = this.state
    if (joined.length === 0) {
      return (
        <div className="box joined">
          <h1>Waiting</h1>
          <h2>for players to join</h2>
        </div>
      )
    }

    return (
      <div className="box joined">
        <div className="box-content">
          <h1>{joined.length}</h1>
          <h2>{joined.length > 1 ? 'Have':'Has'} Joined</h2>
          <div className="attendees-joined"></div>
        </div>
      </div>
    )
  }

  renderOpenQuestion(session) {
    const {question} = session
    return (
      <Question question={question} number={question.index+1} secondsLeft={question.seconds} totalSeconds={question.totalSeconds}>
        { question.options.map((opt,i) => (
          <Option key={i} text={opt} guesses={7} totalGuesses={50} correct={i===2} />
        ))}
      </Question>
    )
  }

  sessionRef = () => this.props.fbc.database.public.adminRef('sessions').child(this.props.sessionId)
  usersRef = () => this.props.fbc.database.public.usersRef()
}

const Option = ({text, correct, guesses, totalGuesses}) => <div className={`option ${correct ? 'correct':''}`}>
  <div className="option-text-back">
    <span>{text}</span><span>{guesses!=null && guesses}</span>
  </div>
  { guesses != null
    ? <div className="option-overlay">
        <div style={{width: `${guesses/totalGuesses*100}%`}}>
          <div className="option-text-front">
            <span>{text}</span><span>{guesses!=null && guesses}</span>
          </div>
        </div>
      </div>
    : null
  }
</div>