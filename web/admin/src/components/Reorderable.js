import React, {PureComponent} from 'react'
import {DragDropContext, Draggable, Droppable} from 'react-beautiful-dnd'

import './Reorderable.css'

export default class Reorderable extends PureComponent {
  render() {
    const {className, data, draggableType, droppableId, enabled, renderDragHandle, renderFooter, renderItem} = this.props
    const getItemId = this.props.getItemId || (x => x.id)
    return (
      <div className={`container ${className}`}>
        <DragDropContext onDragEnd={this.onDragEnd}>
          <Droppable droppableId={droppableId}>
            {(provided, snapshot) => (
              <div className={this.classNames(provided)}
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                { data.map((item, index) => {
                    const id = getItemId(item)
                    return (
                      <Draggable draggableId={id} type={draggableType} key={id} index={index}>
                        {(provided, snapshot) => (
                          <div className="draggable" {...provided.draggableProps}>
                            <div className="draggable-inner"
                              ref={provided.innerRef}
                              {...(renderDragHandle ? null : provided.dragHandleProps )}
                              onFocus={this.onItemFocus}
                            >
                              { renderItem({item, index, dragHandle: enabled && renderDragHandle ? renderDragHandle(provided.dragHandleProps) : null}) }
                            </div>
                            { provided.placeholder }
                          </div>
                        )}
                      </Draggable>
                    )
                  })
                }
                <div>{ provided.placeholder }</div>
              </div>
            )}
          </Droppable>
        </DragDropContext>
        { renderFooter && renderFooter() }
      </div>
    )
  }

  onDragEnd = ({destination, source}) => {
    if (destination) {
      if (source.droppableId === destination.droppableId) {
        if (source.index !== destination.index) {
          this.props.move(source.index, destination.index)
        }
      }
      // Dragging between lists is not implemented
    }
  }

  classNames = (provided) => {
    const classes = ['droppable']
    if (provided.isDragging) classes.push('is-dragging')
    return classes.join(' ')
  }

  onItemFocus = item => () => this.props.onItemFocus && this.props.onItemFocus(item)
}

export const renderLeftDragHandle = dragHandleProps => (
  <div className="drag-handle" {...dragHandleProps}>
    <div className="dots">&bull;&bull;</div>
    <div className="dots">&bull;&bull;</div>
    <div className="dots">&bull;&bull;</div>
  </div>
)