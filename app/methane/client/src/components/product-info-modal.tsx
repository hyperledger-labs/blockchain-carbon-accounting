import { FC } from "react";
import Modal from "react-bootstrap/Modal";
import type { Product } from "../components/static-data";
type AssetInfoModalProps = {
  show:boolean
  product: Product
  onHide:()=>void 
}
const ProductInfoModal:FC<AssetInfoModalProps> = (props) => {
  return (
    <Modal {...props} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Product Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
      </Modal.Body>
    </Modal>
  )
}
export default ProductInfoModal;