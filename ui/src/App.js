import React from 'react';
import {
  Button,
  Box,
  Textarea,
  ChakraProvider,
  Flex,
  Heading,
  Divider,
  useToast,
} from '@chakra-ui/react';
import { FileUpload } from './Upload';
import { generate, uploadFiles, reset } from './api';

import './App.css';
import { db } from './db';

function App() {
  const [images, setImages] = React.useState([]);
  const [descriptions, setDescriptions] = React.useState(
    db.get('descriptions') || []
  );
  const [prompt, setPrompt] = React.useState(
    'Please describe the image for me.'
  );
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const isLoading = isGenerating || isUploading;
  const toast = useToast();

  const handleUploadImages = async e => {
    e.preventDefault();

    if (images.length === 0) {
      alert('Please select images to upload.');
      return;
    }

    try {
      setIsUploading(true);
      await uploadFiles(images);
      toast({
        title: 'Upload successful',
        description: 'Images have been uploaded.',
        status: 'success',
        duration: 9000,
        isClosable: true,
      });
      setImages([]);
      setIsUploading(false);
    } catch {
      setIsUploading(false);
    }
  };

  const handleSubmitGenerate = async e => {
    e.preventDefault();
    setIsGenerating(true);
    const response = await generate(prompt);
    setIsGenerating(false);
    setDescriptions(response);
    db.set('descriptions', response);
  };

  const handleReset = async e => {
    e.preventDefault();
    try {
      await reset();
      toast({
        title: 'Reset successful',
        description: 'Images have been reset.',
        status: 'success',
        duration: 9000,
        isClosable: true,
      });
      setDescriptions([]);
    } catch {
      alert('Error resetting');
    }
  };

  const handleExport = async e => {
    debugger;
    const json = JSON.stringify(descriptions);
    const blob = new Blob([json], { type: 'application/json' });
    const href = await URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = 'descriptions.json';
    link.click();
  };

  return (
    <ChakraProvider>
      <Box
        bg="gray.900"
        w="20%"
        h="100vh"
        position="fixed"
        left="0"
        top="0"
        overflowY="scroll"
      >
        <Box p={4}>
          <Box>
            <Heading as="h2" size="md" my={2}>
              Instructions
            </Heading>
            <p>1. Attatch images</p>
            <p>2. Upload images</p>
            <p>2. Enter a prompt</p>
            <p>3. Click Generate</p>
            <p>4. Reset</p>
          </Box>
          <form onSubmit={handleUploadImages}>
            <Flex mr={2} my={2}>
              <Box mr={2}>
                <FileUpload
                  accept={'image/*'}
                  multiple
                  onChange={e => setImages(Array.from(e.target.files))}
                >
                  <Button isDisabled={isLoading}>Attatch</Button>
                </FileUpload>
              </Box>
              <Button
                mr={2}
                isLoading={isUploading}
                isDisabled={isLoading}
                type="submit"
                colorScheme="blue"
              >
                Upload
              </Button>
              <Button
                onClick={handleReset}
                colorScheme="red"
                isDisabled={isLoading}
              >
                Reset
              </Button>
            </Flex>
            <Flex>
              {images.map((image, index) => (
                <Box mr={2}>
                  <img
                    key={index}
                    src={URL.createObjectURL(image)}
                    alt={image.name}
                  />
                </Box>
              ))}
            </Flex>
          </form>
        </Box>
        <Divider />
        <Box p={4}>
          <Heading as="h2" size="md" my={2}>
            Prompt
          </Heading>
          <form onSubmit={handleSubmitGenerate}>
            <Box>
              <Textarea
                placeholder="Enter your prompt..."
                onChange={e => setPrompt(e.target.value)}
                value={prompt}
              />
            </Box>
            <Button
              type="submit"
              colorScheme="blue"
              mt={2}
              isLoading={isGenerating}
              isDisabled={isLoading}
            >
              Generate
            </Button>
          </form>
        </Box>
      </Box>
      <Box
        bg="gray.800"
        w="80%"
        h="100vh"
        position="fixed"
        right="0"
        top="0"
        overflowY="scroll"
        p={3}
      >
        <Flex mb={4} justifyContent="space-between">
          <Heading as="h2" size="md">
            Descriptions
          </Heading>
          <Button onClick={handleExport}>Export descriptions</Button>
        </Flex>
        <Box>
          {descriptions.map((description, index) => (
            <Box key={index} mb={2} p={3} bg="gray.700" borderRadius="md">
              <p>{description}</p>
              <Button
                mt={2}
                onClick={() => {
                  navigator.clipboard.writeText(description);
                }}
              >
                Copy
              </Button>
            </Box>
          ))}
          {descriptions.length === 0 && (
            <Box my={2}>
              <p>No descriptions yet...</p>
            </Box>
          )}
        </Box>
      </Box>
    </ChakraProvider>
  );
}

export default App;
