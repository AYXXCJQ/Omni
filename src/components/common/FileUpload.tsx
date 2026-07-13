"use client";

import { Upload, Button } from "antd";
import { App } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import type { AttachmentData } from "@/types";

/**
 * 文件上传组件
 *
 * 通过 Antd Upload 上传到 /api/upload，上传成功后通过 onSuccess 回调
 * 将 AttachmentData 返回给父组件，由父组件更新节点状态。
 */
export default function FileUpload({
  nodeId,
  onSuccess,
}: {
  nodeId: string;
  onSuccess?: (attachment: AttachmentData) => void;
}) {
  const { message } = App.useApp();
  const props: UploadProps = {
    name: "file",
    action: "/api/upload",
    data: { nodeId },
    showUploadList: false,
    onChange(info) {
      if (info.file.status === "done") {
        message.success(`${info.file.name} 上传成功`);
        onSuccess?.(info.file.response as AttachmentData);
      } else if (info.file.status === "error") {
        message.error(`${info.file.name} 上传失败`);
      }
    },
  };

  return (
    <Upload {...props}>
      <Button icon={<UploadOutlined />} size="small" type="dashed">
        上传文件
      </Button>
    </Upload>
  );
}
