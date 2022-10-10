import { FC } from "react";
import Modal from "react-bootstrap/Modal";
import type { Asset } from "../components/static-data";
type AssetInfoModalProps = {
  show:boolean
  asset: Asset
  onHide:()=>void 
}
const AssetInfoModal:FC<AssetInfoModalProps> = (props) => {
  return (
    <Modal {...props} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Asset Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
      </Modal.Body>
    </Modal>
  )
}
export default AssetInfoModal;