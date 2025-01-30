import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from "n8n-workflow";
import { NodeOperationError } from "n8n-workflow";
import { Innertube } from "youtubei.js/web";

export class YoutubeTranscriptNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: "Youtube Transcript",
		name: "youtubeTranscript",
		group: ["transform"],
		version: 1,
		description: "Get the transcript of a Youtube video",
		defaults: {
			name: "Youtube Transcript",
		},
		inputs: ["main"],
		outputs: ["main"],
		properties: [
			// Node properties which the user gets displayed and
			// can change on the node.
			{
				displayName: "Youtube Video URL",
				name: "youtubeVideoUrl",
				type: "string",
				default: "",
				placeholder: "Placeholder value",
				description: "The description text",
			},
		],
	};

	// The function below is responsible for actually doing whatever this node
	// is supposed to do. In this case, we're just appending the `myString` property
	// with whatever the user has entered.
	// You can make async calls and use `await`.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		let item: INodeExecutionData;

		// Iterates over all input items and add the key "myString" with the
		// value the parameter "myString" resolves to.
		// (This could be a different value for each item in case it contains an expression)
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const youtubeVideoUrl = this.getNodeParameter("youtubeVideoUrl", itemIndex, "") as string;
				item = items[itemIndex];

				const yt = await Innertube.create({
					lang: 'en',
					retrieve_player: false
				});
				const video = await yt.getInfo(youtubeVideoUrl);
				const transcript = await video.getTranscript();

				item.json.transcript = transcript;
			} catch (error) {
				// This node should never fail but we want to showcase how
				// to handle errors.
				if (this.continueOnFail()) {
					items.push({
						json: this.getInputData(itemIndex)[0].json,
						error,
						pairedItem: itemIndex,
					});
				} else {
					// Adding `itemIndex` allows other workflows to handle this error
					if (error.context) {
						// If the error thrown already contains the context property,
						// only append the itemIndex
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return [items];
	}
}
