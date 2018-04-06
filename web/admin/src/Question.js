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

export default class Question extends PureComponent {
  render () {
    const {children, question, number, secondsLeft, totalSeconds} = this.props
    return (
      <div className="box">
        <div className="box-content">
          <div className="question-title">
            <div>Question {number}</div>
            <div>{durationString(secondsLeft)}</div>
          </div>
        </div>
        <TimerBar ratio={secondsLeft / totalSeconds} />
        <div className="box-content">
          <h2>{question.text}</h2>
          {children}
        </div>
      </div>
    )
  }
}

export const TimerBar = ({ratio}) => <div className="timer-bar"><div className="timer-bar-remaining" style={{width: (ratio*100) + '%'}} /></div>

function durationString(seconds) {
  const s = Math.ceil(seconds)
  const m = Math.floor(s / 60)
  return `${m}:${s < 10 ? '0' : ''}${s}`
}