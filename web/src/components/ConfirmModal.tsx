import {
  Button,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Modal,
  Box,
  Text,
} from "@chakra-ui/react";
import React from "react";

interface ConfirmModalProps {
  title?: string;
  message?: string;
  onConfirm: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  message,
  onConfirm,
  isOpen,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent bg="white">
        <ModalHeader>{title}</ModalHeader>
        <ModalBody textAlign="center">
          <Text>{message}</Text>
        </ModalBody>

        <ModalFooter justifyContent="space-around">
          <Box>
            <Button colorScheme="blackAlpha" onClick={onClose}>
              Close
            </Button>
          </Box>
          <Box>
            <Button variant="regular" onClick={onConfirm}>
              Confirm
            </Button>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
