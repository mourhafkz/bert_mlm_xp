import json
from transformers import BertTokenizer, BertForMaskedLM
import torch
from pprint import pprint

from flask import Flask, render_template, request, jsonify

# name = "twmkn9/albert-base-v2-squad2"
# name = "distilbert-base-uncased-distilled-squad"
name = "bert-base-uncased"

tokenizer = BertTokenizer.from_pretrained(name)
model = BertForMaskedLM.from_pretrained(name)


def bert_process(paragraph_data):
    try:
        # tokenize
        try:
            inputs = tokenizer(paragraph_data, return_tensors="pt")
        except:
            return "error tokenizer. make the sure the input is a string"
        # feed to bert
        outputs = model(**inputs)

        # find masked word positions
        # mask_positions = torch.flatten((inputs.input_ids[0] == 103).nonzero()).tolist() # deprecated nonzero usage
        mask_positions = torch.flatten(torch.nonzero((inputs.input_ids[0] == 103))).tolist()
        print(mask_positions)
        # input_ids
        paragraph_input_ids = inputs.input_ids

        # map ids to tokens
        token2idx = tokenizer.get_vocab()
        # print(token2idx)
        idx2token = {value: key for key, value in token2idx.items()}
        # print(idx2token)
        # extract softmax and argmax for all tokens
        softmax = torch.nn.functional.softmax(outputs.logits[0], dim=0)  # create probability distribution
        argmax = torch.argmax(softmax, dim=1)  # get index of the max probability

        # complete behind the scene text for all tokens
        bert_text_bts = ""
        for i in argmax:
            bert_text_bts += idx2token[i.item()] + ' '

        # find only words at masked position
        word_preds = []
        for i in mask_positions:
            word_preds.append(bert_text_bts.split()[i])

        return word_preds, bert_text_bts, paragraph_input_ids
    except:
        return "error"


app = Flask(__name__, template_folder='templates')


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/masked', methods=['GET', 'POST'])
def masked():
    if request.method == 'POST':
        # text = request.form['text']
        # print(request.values.get('data'))
        paragraph_data = json.loads(request.data)
        sentence, masked_sentence, mask_positions = prepreocess(paragraph_data['data'])
        if len(mask_positions) == 0:
            return jsonify({'error': 'Nothing was masked. Double click to mask a few tokens.'})

        predicted, bert_text_bts, paragraph_input_ids = bert_process(masked_sentence)
        processed = list(zip(predicted, mask_positions))
        mapped_bert_text = map_text(bert_text_bts, paragraph_input_ids[0].tolist())
        print(mapped_bert_text)
        output = {'predictions': processed, 'bert_text_and_ids': mapped_bert_text}
        print(output)
        if processed != "error":
            # the file works so there's no need to recheck
            return jsonify(
                {'data': output})
        else:
            return jsonify({'error': 'Something is wrong with the list. We could not process it.'})
    else:
        return 'GET request successfully'


@app.route('/process', methods=['GET', 'POST'])
def process():
    if request.method == 'POST':
        text = request.form['text']

        processed = convert(text)
        if processed != "error":
            # the file works so there's no need to recheck
            return jsonify(
                {'data': processed})
        else:
            return jsonify({'error': 'Something is wrong with the list. We could not process it.'})
    else:
        return 'GET request successfully'


def convert(text):
    try:
        texts = {}
        order = 0
        for t in text.split():
            texts[order] = {'word': t, 'id': 5}
            order += 1
        texts = {'text': texts}
        return texts
    except:
        return "error"


def prepreocess(paragraph_data):
    paragraph_data = paragraph_data
    sentence = ""  # if needed
    masked_sentence = ""
    mask_positions = []  # if needed
    for k, v in paragraph_data.items():
        # build sentence
        sentence += paragraph_data[k]['word_content'] + " "
        # build masked sentence
        if paragraph_data[k]['word_mask'] == 'true':
            masked_sentence += "[MASK] "
            # find masked positions
            mask_positions.append(k)
        else:
            masked_sentence += paragraph_data[k]['word_content'] + " "

    return sentence, masked_sentence, mask_positions


def map_text(text, ids):
    text_list = text.split()
    output = list(zip(text_list, ids))
    return output


if __name__ == '__main__':
    # tokenizer = BertTokenizer.from_pretrained('D:/bert__flask/offline_bert_uncased')
    # model = BertForMaskedLM.from_pretrained('D:/bert__flask/offline_bert_uncased')
    app.run(debug=True)
