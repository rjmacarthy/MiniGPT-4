import React, { useEffect } from 'react';
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

import { DeleteIcon } from '@chakra-ui/icons';

import { FileUpload } from './Upload';
import { deleteImages, generate, getImages, uploadFiles } from './api';

import './App.css';
import { db } from './db';
import theme from './theme';

function App() {
  const [images, setImages] = React.useState([]);
  const [uploads, setUploads] = React.useState([]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isFetching, setIsFetching] = React.useState(false);
  const [selectedImages, setSelectedImages] = React.useState([]);
  const [descriptions, setDescriptions] = React.useState(
    db.get('descriptions') || []
  );
  const [prompt, setPrompt] = React.useState(
    'Please describe the image for me.'
  );
  const isLoading = isGenerating || isUploading || isFetching;
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
      setImages([]);
      setUploads(data.reverse());
      setIsUploading(false);
    } catch {
      setIsUploading(false);
    }
  };

  const handleSubmitGenerate = async e => {
    e.preventDefault();
    setIsGenerating(true);
    const response = await generate(
      prompt,
      selectedImages,
    );
    setIsGenerating(false);
    setDescriptions(response);
    db.set('descriptions', response);
  };

  const handleExport = async e => {
    if (!descriptions.length) {
      alert('Please generate descriptions first.');
      return;
    }
    const json = JSON.stringify(descriptions);
    const blob = new Blob([json], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = 'descriptions.json';
    link.click();
  };

  const handleSelectImage = async (e, image) => {
    e.preventDefault();
    if (selectedImages?.includes(image)) {
      setSelectedImages(selectedImages.filter(img => img !== image.id));
      return;
    }
    setSelectedImages([...selectedImages, image.id]);
  };

  const handleSelectAll = async e => {
    e.preventDefault();
    setSelectedImages(uploads.map(image => image.id));
  };

  const handleDeleteSelected = async e => {
    e.preventDefault();
    if (selectedImages.length === 0) {
      alert('Please select images to delete.');
      return;
    }
    const data = await deleteImages(selectedImages);
    setUploads(data.reverse());
  };

  useEffect(() => {
    setIsFetching(true);
    const fetchImages = async () => {
      const data = await getImages();
      setUploads(data.reverse());
      setIsFetching(false);
    };
    fetchImages();
  }, []);

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
        css={{
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'gray.700',
            borderRadius: '24px',
          },
        }}
      >
        <Box p={4}>
          <Box mb={4}>
            <Heading as="h2" size="md" mb={2}>
              Image prompt
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
          <form onSubmit={handleUploadImages}>
            <Divider my={4} />
            <Heading as="h2" size="md" mb={2}>
              Upload images
            </Heading>
            <Card width={'100%'} p={2}>
              {images.length === 0 && <Text>No images selected...</Text>}
              <Flex gap={3} flexWrap="wrap">
                {images?.map((image, index) => (
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
        <Box p={4}>
          <Divider my={4} />
          <Heading as="h2" size="md" my={2}>
            Uploaded images
          </Heading>
          <Flex justifyContent={'flex-end'}>
            <Button
              mr={2}
              mb={2}
              onClick={handleSelectAll}
              colorScheme="blue"
              isDisabled={isLoading}
            >
              Select all
            </Button>
            <Button mb={2} onClick={() => setSelectedImages([])}>
              Select none
            </Button>
            {selectedImages?.length > 0 && (
              <Button
                mb={2}
                ml={2}
                onClick={handleDeleteSelected}
                colorScheme="red"
                isDisabled={isLoading}
              >
                <DeleteIcon />
              </Button>
            )}
          </Flex>
          <Card width={'100%'} p={2}>
            <Flex gap={3} flexWrap="wrap">
              {!uploads?.length && !isLoading && (
                <Text>No images uploaded...</Text>
              )}
              {uploads?.map(upload => (
                <Image
                  onClick={e => handleSelectImage(e, upload)}
                  src={`data:image/jpeg;base64,${upload.base64_representation}`}
                  alt={upload.name}
                  boxSize={71}
                  objectFit="cover"
                  cursor="pointer"
                  boxShadow={
                    selectedImages?.includes(upload.id)
                      ? '0 0 0 2px #3182ce'
                      : 'none'
                  }
                />
              ))}
            </Flex>
          </Card>
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
