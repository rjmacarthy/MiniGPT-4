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
  Image,
  Card,
  Text,
} from '@chakra-ui/react';
import { FileUpload } from './Upload';
import { generate, uploadFiles } from './api';

import './App.css';
import { db } from './db';
import theme from './theme';

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
      const data = await uploadFiles(images);
      toast({
        title: 'Upload successful',
        description: 'Images have been uploaded.',
        status: 'success',
        duration: 9000,
        isClosable: true,
      });
      console.log(data);
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

  console.log(theme);
  return (
    <ChakraProvider theme={theme}>
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
          <form onSubmit={handleUploadImages}>
            <Card width={'100%'} p={2}>
              {images.length === 0 && (
                <Text>
                  No images selected...
                </Text>
              )}
              <Flex gap={3} flexWrap="wrap">
                {images.map((image, index) => (
                  <Box>
                    <Image
                      borderRadius={4}
                      key={index}
                      src={URL.createObjectURL(image)}
                      alt={image.name}
                      boxSize={70}
                      objectFit="cover"
                    />
                  </Box>
                ))}
              </Flex>
            </Card>
            <Flex mt={2} justifyContent="flex-end">
              <Box mr={2}>
                <FileUpload
                  accept={'image/*'}
                  multiple
                  onChange={e => setImages(Array.from(e.target.files))}
                >
                  <Button isDisabled={isLoading}>Select images</Button>
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
              colorScheme="green"
              mt={2}
              isLoading={isGenerating}
              isDisabled={isLoading}
            >
              Generate descriptions
            </Button>
          </form>
        </Box>
        <Divider />
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
