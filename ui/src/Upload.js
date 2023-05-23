import { InputGroup } from '@chakra-ui/react'
import { useRef } from 'react'


export const FileUpload = (props) => {
  const { register = {}, accept, multiple, onChange, children } = props
  const { ref, ...rest } = register
  const inputRef = useRef(null)

  const handleClick = () => inputRef.current?.click()

  return (
      <InputGroup onClick={handleClick}>
        <input
          type={'file'}
          multiple={multiple || false}
          hidden
          {...rest}
          accept={accept}
          onChange={(value) => {
            onChange?.(value)
            ref?.(value.target.files)
          }}
          ref={(e) => {
            inputRef.current = e
          }}
        />
        <>
          {children}
        </>
      </InputGroup>
  )
}
